const prisma = require("../config/db");

const dashboardController = {
  getStats: async (req, res) => {
    try {
      // 1. Conteo de entidades básicas
      const [totalClientes, totalVendedores, totalSeriales] = await Promise.all(
        [
          prisma.clientes.count({ where: { deleted_at: null } }),
          prisma.vendedores.count({ where: { activo: true } }),
          prisma.seriales_erp.count({ where: { deleted_at: null } }),
        ]
      );

      // 2. Resumen Financiero
      const ventas = await prisma.ventas.findMany({
        where: { deleted_at: null },
        include: { pagos: { where: { deleted_at: null } } },
      });

      let facturacionTotal = 0;
      let recaudoTotal = 0;

      ventas.forEach((v) => {
        facturacionTotal += parseFloat(v.valor_total);
        v.pagos.forEach((p) => {
          recaudoTotal += parseFloat(p.monto_pagado);
        });
      });

      // 3. Ventas por año gravable (para una gráfica)
      const ventasPorAno = await prisma.ventas.groupBy({
        by: ["ano_gravable"],
        _count: { id: true },
        _sum: { valor_total: true },
        where: { deleted_at: null },
      });

      res.json({
        resumen: {
          clientes: totalClientes,
          vendedores: totalVendedores,
          seriales_activos: totalSeriales,
        },
        finanzas: {
          total_facturado: facturacionTotal,
          total_recaudado: recaudoTotal,
          cartera_pendiente: facturacionTotal - recaudoTotal,
          porcentaje_recaudo:
            facturacionTotal > 0 ? (recaudoTotal / facturacionTotal) * 100 : 0,
        },
        graficas: {
          ventas_por_ano: ventasPorAno,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al generar estadísticas" });
    }
  },
};

module.exports = dashboardController;
