const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// --- FUNCIONES AUXILIARES (Indispensables) ---
const decodeBase64 = (str) => Buffer.from(str, "base64").toString("utf-8");
const generateMD5Hash = (data) =>
  crypto.createHash("md5").update(data).digest("hex").toUpperCase();

exports.generarClaveDesdeSerial = async (req, res) => {
  try {
    const { serial } = req.body;

    if (!serial)
      return res.status(400).json({ error: "El serial es requerido." });

    // 1. Decodificación
    const pistaDos = "ZS8Q5TKU0";
    let decodedData;
    try {
      decodedData = decodeBase64(serial);
    } catch (e) {
      return res.status(400).json({ error: "El formato Base64 es inválido." });
    }

    const partes = decodedData.split(pistaDos);

    if (partes.length < 2) {
      return res
        .status(400)
        .json({ error: "Formato de serial inválido (Pista no encontrada)." });
    }

    const serialERP = partes[0];
    const resto = partes[1];
    const anoMedios = resto.substring(0, 4);
    let macServidor = resto.substring(4).startsWith("|")
      ? resto.substring(5)
      : resto.substring(4);

    // 2. VALIDACIÓN PASO A PASO

    // A. Buscar el serial (sin filtros de activo aún)
    const registroSerial = await prisma.seriales_erp.findFirst({
      where: {
        serial_erp: serialERP,
        deleted_at: null,
      },
      include: {
        clientes: true,
        ventas: true,
      },
    });

    // --- CAMBIO AQUÍ: Mensaje con el serial decodificado ---
    if (!registroSerial) {
      return res.status(404).json({
        error: `El Serial ERP [${serialERP}] no existe en la base de datos. Verifique que coincida exactamente.`,
      });
    }

    // Diagnóstico detallado
    if (!registroSerial) {
      return res.status(404).json({
        error: "El Serial ERP ingresado no existe en nuestra base de datos.",
      });
    }

    if (!registroSerial.activo) {
      return res.status(403).json({
        error: "El Serial ERP existe, pero se encuentra marcado como INACTIVO.",
      });
    }

    if (!registroSerial.clientes) {
      return res
        .status(404)
        .json({ error: "El serial no tiene un cliente vinculado." });
    }

    if (!registroSerial.clientes.activo) {
      return res.status(403).json({
        error: `Acceso denegado: El cliente [${registroSerial.clientes.nombre_comercial}] está INACTIVO o SUSPENDIDO.`,
      });
    }

    // 3. Generación de la clave
    const datosConcatenados = `${serialERP}${pistaDos}${anoMedios}|${macServidor}`;
    const claveGenerada = generateMD5Hash(datosConcatenados);

    // 4. Registro de activación
    const ipOrigen =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    await prisma.activaciones.create({
      data: {
        venta_id: registroSerial.ventas[0]?.id || null,
        mac_servidor: macServidor,
        clave_generated: claveGenerada,
        ip_origin: ipOrigen,
        nombre_equipo: req.body.nombre_equipo || "Web_Client",
      },
    });

    // 5. Respuesta
    res.json({
      serialERP,
      anoMedios,
      macServidor,
      claveGenerada,
      clienteNombre: registroSerial.clientes.nombre_comercial,
      clienteId: registroSerial.cliente_id,
    });
  } catch (error) {
    console.error("Error en GenerarClave:", error);
    res.status(500).json({ error: "Error interno al procesar la clave." });
  }
};
