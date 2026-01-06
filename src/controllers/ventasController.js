const prisma = require("../config/db");

const ventasController = {
  // Obtener todas las ventas con sus relaciones
  getAll: async (req, res) => {
    try {
      // 1. Extraemos el año de los query params (ej: /ventas?ano=2024)
      const { ano } = req.query;

      const ventas = await prisma.ventas.findMany({
        where: {
          deleted_at: null,
          // 2. Si viene el año, filtramos por ano_venta, si no, trae todos
          ...(ano && { ano_venta: parseInt(ano) }),
        },
        include: {
          clientes: {
            select: {
              razon_social: true,
              nit: true,
            },
          },
          vendedores: {
            select: {
              nombre: true,
            },
          },
          seriales_erp: {
            select: {
              serial_erp: true,
              nombre_software: true,
            },
          },
          // Traemos los pagos asociados que no estén eliminados
          pagos: {
            where: { deleted_at: null },
          },
        },
        orderBy: {
          fecha_venta: "desc", // Ordenar por las más recientes primero
        },
      });

      // 3. Mapeo para calcular saldos y estados financieros
      const ventasConSaldo = ventas.map((venta) => {
        // Sumamos todos los montos de la tabla pagos asociados a esta venta
        const totalPagado = venta.pagos.reduce(
          (acc, pago) => acc + parseFloat(pago.monto_pagado || 0),
          0
        );

        const valorVenta = parseFloat(venta.valor_total || 0);
        const saldoPendiente = valorVenta - totalPagado;

        return {
          ...venta,
          resumen_financiero: {
            total_venta: valorVenta,
            total_pagado: totalPagado,
            saldo_pendiente: saldoPendiente,
            // Estado basado en el saldo
            esta_paga: totalPagado >= valorVenta,
            estado_texto:
              totalPagado >= valorVenta
                ? "PAGADA"
                : totalPagado > 0
                ? "PARCIAL"
                : "PENDIENTE",
          },
        };
      });

      res.json(ventasConSaldo);
    } catch (error) {
      console.error("Error en getAll ventas:", error);
      res.status(500).json({
        error: "Error al obtener ventas con saldos",
        details: error.message,
      });
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

  // Obtener una venta por su ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const venta = await prisma.ventas.findUnique({
        where: { id: parseInt(id) },
        include: {
          clientes: true,
          vendedores: true,
          seriales_erp: true,
        },
      });

      if (!venta || venta.deleted_at) {
        return res.status(404).json({ error: "Venta no encontrada" });
      }

      // IMPORTANTE: Convertir BigInt a String/Number para que JSON no falle
      const formattedVenta = {
        ...venta,
        cliente_id: venta.cliente_id.toString(),
        serial_erp_id: venta.serial_erp_id.toString(),
      };

      res.json(formattedVenta);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al obtener la venta" });
    }
  },

  // Actualizar una venta existente
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const ventaActualizada = await prisma.ventas.update({
        where: { id: parseInt(id) },
        data: {
          cliente_id: BigInt(data.cliente_id),
          vendedor_id: data.vendedor_id ? parseInt(data.vendedor_id) : null,
          serial_erp_id: BigInt(data.serial_erp_id),
          ano_gravable: parseInt(data.ano_gravable),
          ano_venta: parseInt(data.ano_venta),
          fecha_venta: new Date(data.fecha_venta),
          valor_total: parseFloat(data.valor_total),
          observaciones: data.observaciones,
        },
      });

      res.json(ventaActualizada);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al actualizar la venta" });
    }
  },
};

module.exports = ventasController;
