const prisma = require("../config/db");

const pagosController = {
  // Obtener todos los pagos registrados
  getAll: async (req, res) => {
    try {
      const pagos = await prisma.pagos.findMany({
        where: { deleted_at: null },
        include: {
          ventas: {
            include: {
              clientes: { select: { razon_social: true, nit: true } },
              seriales_erp: { select: { serial_erp: true } },
            },
          },
        },
      });
      res.json(pagos);
    } catch (error) {
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

      res.status(201).json(nuevoPago);
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
      });
      const formattedPagos = pagos.map((p) => ({
        ...p,
        venta_id: p.venta_id.toString(),
      }));
      res.json(formattedPagos);
    } catch (error) {
      res.status(500).json({ error: "Error al buscar pagos de la venta" });
    }
  },
};

module.exports = pagosController;
