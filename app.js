const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv/config");

const { testConnection } = require("./src/config/database");
const solicitudRoutes = require("./src/routes/solicitudes");
const estadosRoutes = require("./src/routes/estados");

const app = express();

// 1. Middlewares globales
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Ruta de prueba (sin dependencias)
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// 3. Rutas de la API
app.use("/api/solicitudes", solicitudRoutes);

app.use("/api/estados", estadosRoutes);

// 4. Manejador 404 (debe ir al final)
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

module.exports = app;
