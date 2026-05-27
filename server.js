const app = require("./app");
const { testConnection } = require("./src/config/database");
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error(
      "No se pudo conectar a la base de datos. Deteniendo servidor...",
    );
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();
