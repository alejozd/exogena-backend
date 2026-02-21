const crypto = require("crypto");
const prisma = require("../config/db");

// --- FUNCIONES AUXILIARES (Indispensables) ---
const decodeBase64 = (str) => Buffer.from(str, "base64").toString("utf-8");
const generateMD5Hash = (data) =>
  crypto.createHash("md5").update(data).digest("hex").toUpperCase();

const claveMediosController = {
  generarClaveDesdeSerial: async (req, res) => {
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

    // 2. Buscar serial
    const registroSerial = await prisma.seriales_erp.findFirst({
      where: { serial_erp: serialERP, deleted_at: null },
      include: { clientes: true },
    });

    if (!registroSerial) {
      return res.status(404).json({
        error: `El Serial [${serialERP}] no existe en el sistema.`,
      });
    }

    // 3. Buscar venta del año
    const ventaDelAno = await prisma.ventas.findFirst({
      where: {
        serial_erp_id: registroSerial.id,
        ano_gravable: parseInt(anoMedios),
        deleted_at: null,
      },
    });

    if (!ventaDelAno) {
      return res.status(404).json({
        error: `No existe venta registrada para el año ${anoMedios}, 
        del serial [${serialERP}] 
        y cliente [${registroSerial.clientes?.razon_social || "Cliente no vinculado"}].`,
      });
    }

    // 4. Generar clave
    const datosConcatenados = `${serialERP}${pistaDos}${anoMedios}|${macServidor}`;
    const claveGenerada = generateMD5Hash(datosConcatenados);

    const ipOrigenCalculada =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // 5. Guardar activación (OBLIGATORIO)
    await prisma.activaciones.create({
      data: {
        ventas: { connect: { id: ventaDelAno.id } },
        mac_servidor: macServidor,
        clave_generada: claveGenerada,
        ip_origen: ipOrigenCalculada,
        nombre_equipo: req.body.nombre_equipo || "Web_Client",
        fecha_activacion: new Date(),
      },
    });

    // 6. Respuesta final
    res.json({
      serialERP,
      anoMedios,
      macServidor,
      claveGenerada,
      clienteNombre:
        registroSerial.clientes?.razon_social || "Cliente no vinculado",
      info: "Activación registrada con éxito.",
    });
  } catch (error) {
    console.error("Error en GenerarClave:", error);
    res.status(500).json({ error: "Error interno al procesar la clave." });
  }
  },
};

module.exports = claveMediosController;
