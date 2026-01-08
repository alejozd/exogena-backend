const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Funciones de ayuda (Helpers)
const decodeBase64 = (str) => Buffer.from(str, "base64").toString("utf-8");
const generateMD5Hash = (data) =>
  crypto.createHash("md5").update(data).digest("hex").toUpperCase();

exports.generarClaveDesdeSerial = async (req, res) => {
  try {
    const { serial } = req.body;
    if (!serial)
      return res.status(400).json({ error: "El serial es requerido." });

    // 1. Decodificar (Lógica heredada de tu sistema anterior)
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

    // 2. Validar en la BD con Prisma
    // Buscamos el serial y verificamos que el cliente esté activo
    const serialDB = await prisma.seriales_erp.findFirst({
      where: {
        serial_erp: serialERP,
        activo: 1,
        deleted_at: null,
        clientes: { activo: 1 }, // Validamos que el cliente no esté suspendido
      },
      include: { ventas: true }, // Para obtener el ID de la venta y asociar la activación
    });

    if (!serialDB) {
      return res
        .status(404)
        .json({ error: "Serial no encontrado o cliente inactivo." });
    }

    // 3. Generar la Clave
    const datosConcatenados = `${serialERP}${pistaDos}${anoMedios}|${macServidor}`;
    const claveGenerada = generateMD5Hash(datosConcatenados);

    // 4. Registrar la activación (Para tu contador de la tabla)
    const ipOrigen =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    await prisma.activaciones.create({
      data: {
        venta_id: serialDB.ventas[0]?.id, // Asociamos a la primera venta encontrada
        mac_servidor: macServidor,
        clave_generated: claveGenerada,
        ip_origin: ipOrigen,
        nombre_equipo: req.body.nombre_equipo || "Delphi_Client",
      },
    });

    // 5. Respuesta unificada
    res.json({
      serialERP,
      anoMedios,
      macServidor,
      claveGenerada,
      cliente: serialDB.cliente_id, // Útil para el front
    });
  } catch (error) {
    console.error("Error en GenerarClave:", error);
    res.status(500).json({ error: "Error interno al procesar la clave." });
  }
};
