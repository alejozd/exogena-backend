const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // 1. Buscar usuario
      const usuario = await prisma.usuarios.findUnique({ where: { email } });
      if (!usuario || usuario.activo === 0) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // 2. Verificar contraseña
      const validPassword = await bcrypt.compare(password, usuario.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // 3. Generar JWT
      const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
      );

      res.json({
        token,
        usuario: {
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error en el servidor" });
    }
  },
};

module.exports = authController;
