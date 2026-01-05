const prisma = require("../config/db");

const serialesController = {
  // Obtener todos los seriales (opcional con filtros)
  getAll: async (req, res) => {
    try {
      const seriales = await prisma.seriales_erp.findMany({
        where: { deleted_at: null },
        include: { clientes: true }, // Para saber de quién es el serial
      });
      res.json(seriales);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener seriales" });
    }
  },

  // Crear un serial asociado a un cliente
  create: async (req, res) => {
    try {
      const { cliente_id, serial_erp, nombre_software, activo } = req.body;

      const nuevoSerial = await prisma.seriales_erp.create({
        data: {
          // cliente_id es BigInt en la DB, lo convertimos
          cliente_id: BigInt(cliente_id),
          serial_erp,
          nombre_software,
          activo: activo === false || activo === 0 ? false : true,
        },
      });

      res.status(201).json(nuevoSerial);
    } catch (error) {
      if (error.code === "P2002") {
        return res
          .status(400)
          .json({ error: "Este Serial ERP ya está registrado" });
      }
      console.error(error);
      res
        .status(500)
        .json({ error: "Error al crear serial", details: error.message });
    }
  },

  // Obtener seriales por ID de cliente
  getByCliente: async (req, res) => {
    try {
      const { clienteId } = req.params;
      const seriales = await prisma.seriales_erp.findMany({
        where: {
          cliente_id: BigInt(clienteId),
          deleted_at: null,
        },
      });
      res.json(seriales);
    } catch (error) {
      res.status(500).json({ error: "Error al buscar seriales del cliente" });
    }
  },

  // Borrado lógico
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.seriales_erp.update({
        where: { id: BigInt(id) },
        data: { deleted_at: new Date(), activo: false },
      });
      res.json({ message: "Serial eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar serial" });
    }
  },
};

module.exports = serialesController;
