const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const passwordHasheado = await bcrypt.hash("el password", 10);

  const usuario = await prisma.usuarios.create({
    data: {
      nombre: "alejo",
      email: "usuario@gmail.com", // Asegúrate de que este campo exista en tu tabla
      password: passwordHasheado,
      rol: "admin", // O el rol que manejes
    },
  });

  console.log("✅ Usuario creado con éxito:", usuario);
}

main()
  .catch((e) => {
    console.error("❌ Error al crear usuario:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
