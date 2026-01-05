const { PrismaClient } = require("@prisma/client");

// Instanciamos el cliente.
// No necesita argumentos si el schema está en la carpeta /prisma estándar
const prisma = new PrismaClient();

module.exports = prisma;
