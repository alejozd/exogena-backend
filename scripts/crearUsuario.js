/**
 * Script para crear un usuario administrador.
 * Uso: node scripts/crearUsuario.js
 *
 * Configuración vía variables de entorno:
 *   CREAR_USUARIO_NOMBRE  - Nombre del usuario (default: "admin")
 *   CREAR_USUARIO_EMAIL   - Email (default: "admin@exogena.local")
 *   CREAR_USUARIO_PASSWORD - Contraseña (default: "Cambiar123!")
 *   CREAR_USUARIO_ROL     - Rol: admin, vendedor, software (default: "admin")
 *
 * Ejemplo:
 *   CREAR_USUARIO_EMAIL=user@ejemplo.com CREAR_USUARIO_PASSWORD=Secret123 node scripts/crearUsuario.js
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const NOMBRE = process.env.CREAR_USUARIO_NOMBRE || "admin";
const EMAIL = process.env.CREAR_USUARIO_EMAIL || "admin@exogena.local";
const PASSWORD = process.env.CREAR_USUARIO_PASSWORD || "Cambiar123!";
const ROL = process.env.CREAR_USUARIO_ROL || "admin";

async function main() {
  const passwordHasheado = await bcrypt.hash(PASSWORD, 10);

  const usuario = await prisma.usuarios.create({
    data: {
      nombre: NOMBRE,
      email: EMAIL,
      password: passwordHasheado,
      rol: ROL,
    },
  });

  console.log("✅ Usuario creado con éxito:", {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  });
}

main()
  .catch((e) => {
    if (e.code === "P2002") {
      console.error("❌ Ya existe un usuario con ese email:", EMAIL);
    } else {
      console.error("❌ Error al crear usuario:", e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
