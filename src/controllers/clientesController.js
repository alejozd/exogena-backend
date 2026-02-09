const prisma = require("../config/db");

const clientesController = {
  // Obtener todos los clientes
  getAll: async (req, res) => {
    try {
      const clientes = await prisma.clientes.findMany({
        where: { deleted_at: null },
        include: {
          vendedores: true,
          seriales_erp: {
            where: { deleted_at: null },
          },
          // Entramos por ventas para llegar a las activaciones
          ventas: {
            where: { deleted_at: null },
            include: {
              activaciones: {
                where: { deleted_at: null },
              },
            },
          },
        },
      });
      res.json(clientes);
    } catch (error) {
      console.error("Error Prisma:", error); // Esto te dirá en consola si falta algún nombre
      res.status(500).json({ error: "Error al obtener clientes" });
    }
  },

  // Obtener un cliente por NIT
  getByNit: async (req, res) => {
    try {
      const { nit } = req.params;
      const cliente = await prisma.clientes.findUnique({
        where: { nit },
        include: {
          vendedores: true,
          seriales_erp: {
            where: { deleted_at: null },
          },
        },
      });
      if (!cliente)
        return res.status(404).json({ error: "Cliente no encontrado" });
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: "Error al buscar cliente" });
    }
  },

  // Crear cliente
  create: async (req, res) => {
    try {
      const {
        nit,
        razon_social,
        email,
        telefono,
        direccion,
        activo,
        vendedor_id,
      } = req.body;

      const nuevoCliente = await prisma.clientes.create({
        data: {
          nit,
          razon_social,
          email,
          telefono,
          direccion,
          // Convertimos el valor a Booleano (true si es 1 o true, false de lo contrario)
          activo: activo == 1 || activo === true ? true : false,
          vendedor_id: vendedor_id ? parseInt(vendedor_id) : null,
        },
      });

      res.status(201).json(nuevoCliente);
    } catch (error) {
      console.error("LOG DE ERROR:", error);
      if (error.code === "P2002")
        return res.status(400).json({ error: "El NIT o Email ya existe" });
      res
        .status(500)
        .json({ error: "Error al crear cliente", details: error.message });
    }
  },

  // Actualizar cliente
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nit,
        razon_social,
        email,
        telefono,
        direccion,
        activo,
        vendedor_id,
      } = req.body;

      const clienteActualizado = await prisma.clientes.update({
        where: { id: BigInt(id) },
        data: {
          nit,
          razon_social,
          email,
          telefono,
          direccion,
          activo: activo == 1 || activo === true ? true : false,
          vendedor_id: vendedor_id ? parseInt(vendedor_id) : null,
        },
      });
      res.json(clienteActualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al actualizar cliente" });
    }
  },

  // Borrado Lógico (Soft Delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.clientes.update({
        where: { id: BigInt(id) },
        data: { deleted_at: new Date(), activo: 0 },
      });
      res.json({ message: "Cliente eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar cliente" });
    }
  },
};

module.exports = clientesController;
