const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password
      ) {
        return res.status(400).json({
          error: "Email y contraseña son obligatorios",
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET no está configurado en las variables de entorno");
        return res.status(500).json({ error: "Error de configuración del servidor" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Buscar usuario
      const usuario = await prisma.usuarios.findUnique({
        where: { email: normalizedEmail },
      });
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
