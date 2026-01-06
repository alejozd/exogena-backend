const prisma = require("../config/db");

const dashboardController = {
  getStats: async (req, res) => {
    try {
      // 1. Obtener el año del query string (ej: ?ano=2024)
      // Si no viene, usamos el año actual
      const { ano } = req.query;
      const anoFiltro = ano ? parseInt(ano) : new Date().getFullYear();

      // 2. Conteo de entidades básicas (Totales globales)
      const [totalClientes, totalVendedores, totalSeriales] = await Promise.all(
        [
          prisma.clientes.count({ where: { deleted_at: null } }),
          prisma.vendedores.count({ where: { activo: true } }),
          prisma.seriales_erp.count({ where: { deleted_at: null } }),
        ]
      );

      // 3. Resumen Financiero FILTRADO por año
      const ventas = await prisma.ventas.findMany({
        where: {
          deleted_at: null,
          ano_gravable: anoFiltro, // <-- Filtro por año
        },
        include: {
          pagos: { where: { deleted_at: null } },
        },
      });

      let facturacionTotal = 0;
      let recaudoTotal = 0;

      ventas.forEach((v) => {
        facturacionTotal += parseFloat(v.valor_total || 0);
        v.pagos.forEach((p) => {
          recaudoTotal += parseFloat(p.monto_pagado || 0);
        });
      });

      // 4. Ventas por año gravable (Histórico para la gráfica)
      // Esta la dejamos sin filtrar por el año seleccionado para que la gráfica
      // muestre la comparativa de todos los años disponibles
      const ventasPorAno = await prisma.ventas.groupBy({
        by: ["ano_gravable"],
        _count: { id: true },
        _sum: { valor_total: true },
        where: { deleted_at: null },
        orderBy: { ano_gravable: "asc" },
      });

      res.json({
        resumen: {
          clientes: totalClientes,
          vendedores: totalVendedores,
          seriales_activos: totalSeriales,
        },
        finanzas: {
          ano_consultado: anoFiltro,
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
      console.error("Error en dashboardController:", error);
      res.status(500).json({ error: "Error al generar estadísticas" });
    }
  },
};

module.exports = dashboardController;
