const prisma = require("../config/db");
const { serializeBigInt } = require("../utils/serializeBigInt");

const activacionController = {
  getAll: async (req, res) => {
    try {
      const rows = await prisma.activaciones.findMany({
        where: { deleted_at: null },
        include: {
          ventas: {
            include: {
              clientes: true,
              seriales_erp: true,
            },
          },
        },
        orderBy: { fecha_activacion: "desc" },
      });

      res.json(serializeBigInt(rows));
    } catch (error) {
      console.error("Error en getAll activaciones:", error);
      res.status(500).json({ error: "Error al obtener listado global" });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "ID requerido" });
      }

      const row = await prisma.activaciones.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
        },
        include: {
          ventas: {
            include: {
              clientes: true,
              seriales_erp: true,
            },
          },
        },
      });

      if (!row) {
        return res.status(404).json({ error: "Activación no encontrada" });
      }

      res.json(serializeBigInt(row));
    } catch (error) {
      console.error("Error en getById activaciones:", error);
      res.status(500).json({ error: "Error al obtener la activación" });
    }
  },

  getByVenta: async (req, res) => {
    try {
      const { venta_id } = req.params;
      const rows = await prisma.activaciones.findMany({
        where: {
          venta_id: BigInt(venta_id),
          deleted_at: null,
        },
        orderBy: { fecha_activacion: "desc" },
      });

      res.json(serializeBigInt(rows));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al obtener activaciones" });
    }
  },

  create: async (req, res) => {
    try {
      const {
        venta_id,
        serial_recibido,
        mac_servidor,
        clave_generada,
        ip_origen,
        nombre_equipo,
        observaciones,
      } = req.body;

      if (!venta_id || !mac_servidor || !clave_generada) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
      }

      await prisma.activaciones.create({
        data: {
          venta_id: BigInt(venta_id),
          serial_recibido: serial_recibido || null,
          mac_servidor,
          clave_generada,
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

module.exports = activacionController;
