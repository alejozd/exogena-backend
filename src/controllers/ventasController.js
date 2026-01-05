const prisma = require("../config/db");

const ventasController = {
  // Obtener todas las ventas con sus relaciones
  getAll: async (req, res) => {
    try {
      const ventas = await prisma.ventas.findMany({
        where: { deleted_at: null },
        include: {
          clientes: { select: { razon_social: true, nit: true } },
          vendedores: { select: { nombre: true } },
          seriales_erp: { select: { serial_erp: true, nombre_software: true } },
          pagos: { where: { deleted_at: null } }, // Traemos sus pagos
        },
      });

      // Calculamos el saldo para cada venta antes de enviar la respuesta
      const ventasConSaldo = ventas.map((venta) => {
        const totalPagado = venta.pagos.reduce(
          (acc, pago) => acc + parseFloat(pago.monto_pagado),
          0
        );
        const valorVenta = parseFloat(venta.valor_total);

        return {
          ...venta,
          resumen_financiero: {
            total_venta: valorVenta,
            total_pagado: totalPagado,
            saldo_pendiente: valorVenta - totalPagado,
            esta_paga: totalPagado >= valorVenta,
          },
        };
      });

      res.json(ventasConSaldo);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener ventas con saldos" });
    }
  },

  // Crear una nueva venta
  create: async (req, res) => {
    try {
      const {
        cliente_id,
        vendedor_id,
        serial_erp_id,
        ano_gravable,
        ano_venta,
        fecha_venta,
        valor_total,
        estado_pago,
        observaciones,
      } = req.body;

      const nuevaVenta = await prisma.ventas.create({
        data: {
          cliente_id: BigInt(cliente_id),
          vendedor_id: vendedor_id ? parseInt(vendedor_id) : null,
          serial_erp_id: BigInt(serial_erp_id),
          ano_gravable: parseInt(ano_gravable),
          ano_venta: parseInt(ano_venta),
          fecha_venta: new Date(fecha_venta), // Formato esperado "YYYY-MM-DD"
          valor_total: parseFloat(valor_total),
          estado_pago: estado_pago || "pendiente",
          observaciones,
        },
      });

      res.status(201).json(nuevaVenta);
    } catch (error) {
      console.error(error);
      if (error.code === "P2002") {
        return res.status(400).json({
          error:
            "Ya existe una venta para este serial en el mismo año gravable",
        });
      }
      res
        .status(500)
        .json({ error: "Error al registrar la venta", details: error.message });
    }
  },

  // Obtener ventas de un cliente específico
  getByCliente: async (req, res) => {
    try {
      const { clienteId } = req.params;
      const ventas = await prisma.ventas.findMany({
        where: {
          cliente_id: BigInt(clienteId),
          deleted_at: null,
        },
        include: { seriales_erp: true },
      });
      res.json(ventas);
    } catch (error) {
      res.status(500).json({ error: "Error al buscar ventas del cliente" });
    }
  },
};

module.exports = ventasController;
