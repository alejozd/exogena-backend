const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const decodeBase64 = (str) => Buffer.from(str, "base64").toString("utf-8");
const generateMD5Hash = (data) =>
  crypto.createHash("md5").update(data).digest("hex").toUpperCase();

exports.generarClaveDesdeSerial = async (req, res) => {
  console.log("--- Inicio de Generar Clave ---");
  console.log("Body recibido:", req.body);

  try {
    const { serial } = req.body;
    if (!serial)
      return res.status(400).json({ error: "El serial es requerido." });

    const pistaDos = "ZS8Q5TKU0";
    const decodedData = decodeBase64(serial);
    const partes = decodedData.split(pistaDos);

    if (partes.length < 2)
      return res.status(400).json({ error: "Formato de serial inválido." });

    const serialERP = partes[0];
    const resto = partes[1];
    const anoMedios = resto.substring(0, 4);
    let macServidor = resto.substring(4).startsWith("|")
      ? resto.substring(5)
      : resto.substring(4);

    console.log("Datos parseados:", { serialERP, anoMedios, macServidor });

    // 2. Validar en la BD
    const serialDB = await prisma.seriales_erp.findFirst({
      where: {
        serial_erp: serialERP,
        activo: 1,
        deleted_at: null,
      },
      include: {
        ventas: true,
        clientes: true, // Cambiado para verificar la relación
      },
    });

    if (!serialDB) {
      console.log("Serial no encontrado en DB o inactivo:", serialERP);
      return res
        .status(404)
        .json({ error: "Serial no encontrado o cliente inactivo." });
    }

    console.log("Serial encontrado en DB. ID Venta:", serialDB.ventas[0]?.id);

    // 3. Generar la Clave
    const datosConcatenados = `${serialERP}${pistaDos}${anoMedios}|${macServidor}`;
    const claveGenerada = generateMD5Hash(datosConcatenados);

    // 4. Registrar la activación
    const ipOrigen =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    console.log("Intentando crear registro de activación...");

    // NOTA: Revisa si tus campos en la tabla 'activaciones' se llaman exactamente así:
    // venta_id, mac_servidor, clave_generada (o clave_generated), ip_origin
    await prisma.activaciones.create({
      data: {
        venta_id: serialDB.ventas[0]?.id || null,
        mac_servidor: macServidor,
        clave_generada: claveGenerada, // He cambiado generated -> generada por estándar, verifica tu DB
        ip_origin: ipOrigen,
        nombre_equipo: req.body.nombre_equipo || "Delphi_Client",
      },
    });

    console.log("Activación registrada con éxito.");

    res.json({
      serialERP,
      anoMedios,
      macServidor,
      claveGenerada,
      cliente: serialDB.cliente_id,
    });
  } catch (error) {
    console.error("--- ERROR EN GENERAR CLAVE ---");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack); // Esto te dirá la línea exacta del error
    res.status(500).json({ error: "Error interno: " + error.message });
  }
};
