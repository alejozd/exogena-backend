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
    let macServidor = resto.substring(4).startsWith("|")
      ? resto.substring(5)
      : resto.substring(4);

    // 2. VALIDACIÓN PASO A PASO

    // A. Buscar el serial sin filtros de "activo" para saber si existe
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

    if (!registroSerial) {
      return res
        .status(404)
        .json({
          error: "El Serial ERP ingresado no existe en la base de datos.",
        });
    }

    // B. Verificar si el serial está activo
    if (!registroSerial.activo) {
      return res
        .status(403)
        .json({ error: "El Serial ERP existe, pero se encuentra INACTIVO." });
    }

    // C. Verificar existencia y estado del cliente vinculado
    if (!registroSerial.clientes) {
      return res
        .status(404)
        .json({ error: "El serial no tiene un cliente vinculado." });
    }

    if (!registroSerial.clientes.activo) {
      return res
        .status(403)
        .json({
          error: `El cliente [${registroSerial.clientes.nombre_comercial}] está INACTIVO/SUSPENDIDO.`,
        });
    }

    // 3. Si pasó todas las validaciones, generamos la clave
    const datosConcatenados = `${serialERP}${pistaDos}${anoMedios}|${macServidor}`;
    const claveGenerada = generateMD5Hash(datosConcatenados);

    // 4. Registrar activación
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

    res.json({
      serialERP,
      anoMedios,
      macServidor,
      claveGenerada,
      cliente: registroSerial.cliente_id,
    });
  } catch (error) {
    console.error("Error en GenerarClave:", error);
    res.status(500).json({ error: "Error interno al procesar la clave." });
  }
};
