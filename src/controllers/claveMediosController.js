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
    const decodedData = decodeBase64(serial);
    const partes = decodedData.split(pistaDos);

    if (partes.length < 2)
      return res.status(400).json({ error: "Formato de serial inválido." });

    const serialERP = partes[0];
    const resto = partes[1];
    const anoMedios = resto.substring(0, 4);
    const macServidor = resto.substring(4).startsWith("|")
      ? resto.substring(5)
      : resto.substring(4);

    // 2. Búsqueda y Validación
    const registroSerial = await prisma.seriales_erp.findFirst({
      where: { serial_erp: serialERP, deleted_at: null },
      include: { clientes: true, ventas: true },
    });

    if (!registroSerial) {
      return res
        .status(404)
        .json({
          error: `El Serial [${serialERP}] no existe en la base de datos.`,
        });
    }

    // --- NUEVA VALIDACIÓN: EL SERIAL EXISTE PERO NO TIENE VENTA ---
    if (!registroSerial.ventas || registroSerial.ventas.length === 0) {
      return res.status(412).json({
        error: "Serial sin Venta Asociada",
        detalles: `El serial ${serialERP} existe y pertenece a [${registroSerial.clientes?.nombre_comercial}], pero no tiene un registro de VENTA.`,
        sugerencia:
          "Debe crear la venta en el módulo administrativo antes de activar este producto.",
      });
    }

    // 3. Generación de la Clave
    const datosConcatenados = `${serialERP}${pistaDos}${anoMedios}|${macServidor}`;
    const claveGenerada = generateMD5Hash(datosConcatenados);

    // 4. Registro de Activación (Corregido con ip_origen y nombres de Prisma)
    const ipOrigenCalculada =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    await prisma.activaciones.create({
      data: {
        // Como validamos arriba que existe, aquí siempre habrá un ID
        ventas: {
          connect: { id: registroSerial.ventas[0].id },
        },
        mac_servidor: macServidor,
        clave_generada: claveGenerada,
        ip_origen: ipOrigenCalculada,
        nombre_equipo: req.body.nombre_equipo || "Web_Client",
        fecha_activacion: new Date(),
      },
    });

    // 5. Respuesta Exitosa
    res.json({
      serialERP,
      anoMedios,
      macServidor,
      claveGenerada,
      clienteNombre: registroSerial.clientes.nombre_comercial,
    });
  } catch (error) {
    console.error("Error en GenerarClave:", error);
    res.status(500).json({ error: "Error interno al procesar la clave." });
  }
};
