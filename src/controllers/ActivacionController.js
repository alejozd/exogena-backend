const prisma = require("../config/db");

const ActivacionController = {
  // 1. LISTADO GLOBAL (Todas las activaciones con datos de cliente y software)
  getAll: async (req, res) => {
    try {
      const rows = await prisma.activaciones.findMany({
        where: { deleted_at: null },
        include: {
          ventas: {
            // Relación con Ventas
            include: {
              clientes: true, // Dentro de venta, traer el Cliente
              seriales_erp: true, // Dentro de venta, traer el Serial/Software
            },
          },
        },
        orderBy: { fecha_activacion: "desc" },
      });

      // Serialización para manejar BigInt
      const serialized = JSON.parse(
        JSON.stringify(rows, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      res.json(serialized);
    } catch (error) {
      console.error("Error en getAll activaciones:", error);
      res.status(500).json({ error: "Error al obtener listado global" });
    }
  },

  // 2. LISTADO POR VENTA
  getByVenta: async (req, res) => {
    try {
      const { venta_id } = req.params;
      // Usando sintaxis de Prisma
      const rows = await prisma.activaciones.findMany({
        where: {
          venta_id: BigInt(venta_id),
          deleted_at: null,
        },
        orderBy: {
          fecha_activacion: "desc",
        },
      });

      // Convertir BigInt a String para evitar errores de JSON
      const serialized = JSON.parse(
        JSON.stringify(rows, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      res.json(serialized);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al obtener activaciones" });
    }
  },

  // 3. CREAR
  create: async (req, res) => {
    try {
      const {
        venta_id,
        mac_servidor,
        clave_generada,
        ip_origen,
        nombre_equipo,
        observaciones,
      } = req.body;

      if (!venta_id || !mac_servidor || !clave_generada) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
      }

      const result = await prisma.activaciones.create({
        data: {
          venta_id: BigInt(venta_id),
          mac_servidor,
          clave_generated: clave_generada, // Verifica si en Prisma es clave_generada o clave_generada
          ip_origen,
          nombre_equipo,
          observaciones,
        },
      });

      res.status(201).json({ message: "Activación registrada con éxito" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al procesar la activación" });
    }
  },

  // 4. BORRADO LÓGICO
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.activaciones.update({
        where: { id: BigInt(id) },
        data: { deleted_at: new Date() },
      });
      res.json({ message: "Activación eliminada" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar" });
    }
  },
};

module.exports = ActivacionController;
