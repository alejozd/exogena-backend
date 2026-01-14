const prisma = require("../config/db");

const pagosController = {
  // Obtener todos los pagos registrados (con filtro de año)
  getAll: async (req, res) => {
    try {
      const { ano } = req.query; // Recibimos el año desde la URL (?ano=2024)

      let whereClause = { deleted_at: null };

      // Si envían año, filtramos por el rango de fechas
      if (ano) {
        whereClause.fecha_pago = {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`),
        };
      }

      const pagos = await prisma.pagos.findMany({
        where: whereClause,
        orderBy: { fecha_pago: "desc" }, // Los más recientes primero
        include: {
          ventas: {
            include: {
              clientes: { select: { razon_social: true, nit: true } },
              seriales_erp: {
                select: { serial_erp: true, nombre_software: true },
              },
            },
          },
        },
      });

      // Serialización manual para BigInt (evita errores de JSON)
      const formattedPagos = pagos.map((p) => ({
        ...p,
        id: p.id.toString(),
        venta_id: p.venta_id.toString(),
      }));

      res.json(formattedPagos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al obtener los pagos" });
    }
  },

  // Registrar un nuevo pago
  create: async (req, res) => {
    try {
      const {
        venta_id,
        monto_pagado,
        fecha_pago,
        metodo_pago,
        referencia_pago,
        observaciones,
      } = req.body;

      // Usamos una transacción para asegurar consistencia si luego
      // decides actualizar el estado_pago de la venta automáticamente
      const nuevoPago = await prisma.pagos.create({
        data: {
          venta_id: BigInt(venta_id),
          monto_pagado: parseFloat(monto_pagado),
          fecha_pago: new Date(fecha_pago),
          metodo_pago: metodo_pago || "transferencia",
          referencia_pago,
          observaciones,
        },
      });

      res.status(201).json({
        ...nuevoPago,
        id: nuevoPago.id.toString(),
        venta_id: nuevoPago.venta_id.toString(),
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Error al registrar el pago", details: error.message });
    }
  },

  // Obtener pagos de una venta específica
  getByVenta: async (req, res) => {
    try {
      const { ventaId } = req.params;
      const pagos = await prisma.pagos.findMany({
        where: {
          venta_id: BigInt(ventaId),
          deleted_at: null,
        },
        orderBy: { fecha_pago: "desc" },
      });

      const formattedPagos = pagos.map((p) => ({
        ...p,
        id: p.id.toString(),
        venta_id: p.venta_id.toString(),
      }));

      res.json(formattedPagos);
    } catch (error) {
      res.status(500).json({ error: "Error al buscar pagos de la venta" });
    }
  },
};

module.exports = pagosController;
