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

    // 2. Búsqueda de Serial y Cliente
    const registroSerial = await prisma.seriales_erp.findFirst({
      where: { serial_erp: serialERP, deleted_at: null },
      include: { clientes: true, ventas: true },
    });

    if (!registroSerial) {
      return res
        .status(404)
        .json({ error: `El Serial [${serialERP}] no existe.` });
    }

    // 3. GENERACIÓN DE LA CLAVE (Esto ocurre siempre, haya venta o no)
    const datosConcatenados = `${serialERP}${pistaDos}${anoMedios}|${macServidor}`;
    const claveGenerada = generateMD5Hash(datosConcatenados);

    // 4. INTENTO DE REGISTRO (Opcional)
    const ipOrigenCalculada =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const ventaEncontrada =
      registroSerial.ventas && registroSerial.ventas.length > 0
        ? registroSerial.ventas[0].id
        : null;

    let guardadoEnHistorial = false;

    if (ventaEncontrada) {
      try {
        await prisma.activaciones.create({
          data: {
            ventas: { connect: { id: ventaEncontrada } },
            mac_servidor: macServidor,
            clave_generada: claveGenerada,
            ip_origen: ipOrigenCalculada,
            nombre_equipo: req.body.nombre_equipo || "Web_Client",
            fecha_activacion: new Date(),
          },
        });
        guardadoEnHistorial = true;
      } catch (dbError) {
        console.error(
          "No se pudo guardar la activación en DB:",
          dbError.message
        );
      }
    }

    // 5. RESPUESTA (Siempre envía la clave)
    res.json({
      serialERP,
      anoMedios,
      macServidor,
      claveGenerada,
      clienteNombre:
        registroSerial.clientes?.nombre_comercial || "Cliente no vinculado",
      info: guardadoEnHistorial
        ? "Activación registrada con éxito."
        : "Clave generada PERO NO GUARDADA (Serial no tiene venta asociada).",
    });
  } catch (error) {
    console.error("Error en GenerarClave:", error);
    res.status(500).json({ error: "Error interno al procesar la clave." });
  }
};
