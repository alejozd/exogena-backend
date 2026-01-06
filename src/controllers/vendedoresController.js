const prisma = require("../config/db");

const vendedoresController = {
  // Obtener todos los vendedores
  getAll: async (req, res) => {
    try {
      const vendedores = await prisma.vendedores.findMany({
        include: {
          _count: {
            select: { clientes: true }, // Esto te dirá cuántos clientes tiene cada vendedor
          },
        },
      });
      res.json(vendedores);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener vendedores" });
    }
  },

  // Crear un vendedor
  create: async (req, res) => {
    try {
      const { nombre, email, telefono, activo } = req.body;

      const nuevoVendedor = await prisma.vendedores.create({
        data: {
          nombre,
          email,
          telefono,
          // Manejo seguro del booleano para evitar el error anterior
          activo: activo === false || activo === 0 ? false : true,
        },
      });

      res.status(201).json(nuevoVendedor);
    } catch (error) {
      if (error.code === "P2002") {
        return res
          .status(400)
          .json({ error: "El email del vendedor ya existe" });
      }
      res
        .status(500)
        .json({ error: "Error al crear vendedor", details: error.message });
    }
  },

  // Obtener un vendedor específico con sus clientes
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const vendedor = await prisma.vendedores.findUnique({
        where: { id: parseInt(id) },
        include: { clientes: true },
      });

      if (!vendedor)
        return res.status(404).json({ error: "Vendedor no encontrado" });
      res.json(vendedor);
    } catch (error) {
      res.status(500).json({ error: "Error al buscar el vendedor" });
    }
  },

  // Actualizar un vendedor
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, email, telefono, activo } = req.body;
      const vendedorActualizado = await prisma.vendedores.update({
        where: { id: parseInt(id) },
        data: { nombre, email, telefono, activo },
      });
      res.json(vendedorActualizado);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar vendedor" });
    }
  },

  // Eliminar (O desactivar)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.vendedores.delete({ where: { id: parseInt(id) } });
      res.json({ message: "Vendedor eliminado correctamente" });
    } catch (error) {
      res
        .status(500)
        .json({
          error: "No se puede eliminar: el vendedor tiene registros asociados",
        });
    }
  },
};

module.exports = vendedoresController;
