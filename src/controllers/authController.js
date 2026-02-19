const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ROLES_VALIDOS = new Set(["admin", "vendedor", "software"]);

const isEnumRoleError = (error) => {
  const message = error?.message || "";
  return (
    error?.name === "PrismaClientUnknownRequestError" &&
    message.includes("Value") &&
    message.includes("not found in enum 'usuarios_rol'")
  );
};

const getUsuarioByEmail = async (normalizedEmail) => {
  try {
    return await prisma.usuarios.findUnique({
      where: { email: normalizedEmail },
    });
  } catch (error) {
    if (!isEnumRoleError(error)) {
      throw error;
    }

    console.warn(
      "Usuario con valor de rol inválido para enum Prisma. Se usa fallback SQL para login:",
      normalizedEmail,
    );

    const rows = await prisma.$queryRaw`
      SELECT id, nombre, email, password, rol, activo
      FROM usuarios
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;

    return rows?.[0] || null;
  }
};

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

const verifyPassword = async ({ plainPassword, storedPassword, req }) => {
  if (typeof plainPassword !== "string" || typeof storedPassword !== "string") {
    return false;
  }

  // 1) Flujo normal con bcrypt
  if (isBcryptHash(storedPassword)) {
    let validPassword = await bcrypt.compare(plainPassword, storedPassword);

    // Si el login llega como x-www-form-urlencoded, el carácter '+'
    // se decodifica como espacio. Probamos este fallback para
    // contraseñas que incluyen '+' y evitar falsos negativos.
    if (
      !validPassword &&
      plainPassword.includes(" ") &&
      req.is?.("application/x-www-form-urlencoded")
    ) {
      validPassword = await bcrypt.compare(
        plainPassword.replace(/ /g, "+"),
        storedPassword,
      );
    }

    if (validPassword) {
      return true;
    }
  }

  // 2) Fallback legacy: bases con contraseña sin hash
  return plainPassword === storedPassword;
};

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body ?? {};

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
        console.error(
          "JWT_SECRET no está configurado en las variables de entorno",
        );
        return res
          .status(500)
          .json({ error: "Error de configuración del servidor" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Buscar usuario
      const usuario = await getUsuarioByEmail(normalizedEmail);
      if (!usuario || usuario.activo === 0 || usuario.activo === false) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // 2. Verificar contraseña
      const validPassword = await verifyPassword({
        plainPassword: password,
        storedPassword: usuario.password,
        req,
      });

      if (!validPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const rolUsuario = String(usuario.rol ?? "").trim().toLowerCase();
      const rol = ROLES_VALIDOS.has(rolUsuario) ? rolUsuario : "vendedor";

      // 3. Generar JWT
      const token = jwt.sign({ id: usuario.id, rol }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      });

      res.json({
        token,
        usuario: {
          nombre: usuario.nombre,
          email: usuario.email,
          rol,
        },
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },
};

module.exports = authController;
