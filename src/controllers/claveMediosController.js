const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const decodeBase64 = (str) => Buffer.from(str, "base64").toString("utf-8");
const generateMD5Hash = (data) =>
  crypto.createHash("md5").update(data).digest("hex").toUpperCase();

exports.generarClaveDesdeSerial = async (req, res) => {
  try {
    const { serial } = req.body;
    console.log("--- INICIO GENERACIÓN CLAVE ---");
    console.log("Serial Recibido (Base64):", serial);

    if (!serial)
      return res.status(400).json({ error: "El serial es requerido." });

    // 1. Decodificar
    const pistaDos = "ZS8Q5TKU0";
    const decodedData = decodeBase64(serial);
    console.log("Data Decodificada:", decodedData);

    const partes = decodedData.split(pistaDos);

    if (partes.length < 2) {
      console.log("ERROR: No se encontró la pista en el serial");
      return res.status(400).json({ error: "Formato de serial inválido." });
    }

    const serialERP = partes[0];
    const resto = partes[1];
    const anoMedios = resto.substring(0, 4);
    let macServidor = resto.substring(4).startsWith("|")
      ? resto.substring(5)
      : resto.substring(4);

    console.log(
      "Parsed -> SerialERP:",
      serialERP,
      "| Año:",
      anoMedios,
      "| MAC:",
      macServidor
    );

    // 2. Validar en la BD con Prisma
    // IMPORTANTE: Se cambió 'activo: 1' por 'activo: true'
    const serialDB = await prisma.seriales_erp.findFirst({
      where: {
        serial_erp: serialERP,
        activo: true, // Prisma usa booleanos
        deleted_at: null,
        clientes: { activo: true },
      },
      include: { ventas: true },
    });

    if (!serialDB) {
      console.log("ERROR: Serial no encontrado o cliente inactivo en DB");
      return res
        .status(404)
        .json({ error: "Serial no encontrado o cliente inactivo." });
    }

    // 3. Generar la Clave
    const datosConcatenados = `${serialERP}${pistaDos}${anoMedios}|${macServidor}`;
    const claveGenerada = generateMD5Hash(datosConcatenados);
    console.log("Clave Generada con Éxito:", claveGenerada);

    // 4. Registrar la activación
    const ipOrigen =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Asegúrate que el campo se llame clave_generated o clave_generada según tu DB
    await prisma.activaciones.create({
      data: {
        venta_id: serialDB.ventas[0]?.id || null,
        mac_servidor: macServidor,
        clave_generated: claveGenerada,
        ip_origin: ipOrigen,
        nombre_equipo: req.body.nombre_equipo || "Web_Client",
      },
    });

    console.log("Registro de activación guardado en DB");
    console.log("--- FIN PROCESO ---");

    res.json({
      serialERP,
      anoMedios,
      macServidor,
      claveGenerada,
      cliente: serialDB.cliente_id,
    });
  } catch (error) {
    console.error("Error en GenerarClave:", error);
    res.status(500).json({ error: "Error interno al procesar la clave." });
  }
};
