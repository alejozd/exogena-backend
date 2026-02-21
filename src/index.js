require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Permite serializar respuestas con IDs BigInt de Prisma sin lanzar errores de JSON.
if (typeof BigInt.prototype.toJSON !== "function") {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

// Importar rutas
const clientesRoutes = require("./routes/clientesRoutes");
const vendedoresRoutes = require("./routes/vendedoresRoutes");
const serialesRoutes = require("./routes/serialesRoutes");
const ventasRoutes = require("./routes/ventasRoutes");
const pagosRoutes = require("./routes/pagosRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const activacionRoutes = require("./routes/activacionRoutes");
const claveMediosRoutes = require("./routes/claveMediosRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3421;

// Middlewares globales
app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/clientes", clientesRoutes);
app.use("/api/vendedores", vendedoresRoutes);
app.use("/api/seriales", serialesRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/activaciones", activacionRoutes);
app.use("/api/generar-clave", claveMediosRoutes);
app.use("/api/auth", authRoutes);

// Ruta de salud
app.get("/", (req, res) => {
  res.json({
    message: "Exógena Backend corriendo correctamente",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Servidor Exógena Backend corriendo en http://localhost:${PORT}`);
});
