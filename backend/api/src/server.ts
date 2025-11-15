import dotenv from "dotenv";
import https from "https";
import fs from "fs";
import path from "path";
import app from "./app";
import logger from "./config/logger";

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3000;
// Solo usar HTTPS si USE_HTTPS está explícitamente configurado como "true"
const USE_HTTPS = process.env.USE_HTTPS === "true";

let server;

if (USE_HTTPS) {
  // Configuración HTTPS
  const certPath = path.join(__dirname, "../certs/cert.pem");
  const keyPath = path.join(__dirname, "../certs/key.pem");

  // Verificar que existen los certificados
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    logger.error("❌ Error: No se encontraron los certificados SSL");
    logger.error(`   Cert path: ${certPath}`);
    logger.error(`   Key path: ${keyPath}`);
    logger.error("   Por favor, genera los certificados SSL primero.");
    process.exit(1);
  }

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  server = https.createServer(httpsOptions, app).listen(PORT, () => {
    logger.info(`🚀 Smashly API server running on port ${PORT} (HTTPS)`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`🔗 Health check: https://localhost:${PORT}/api/v1/health`);
    logger.info(`📚 API Documentation: https://localhost:${PORT}/api/v1/docs`);
  });
} else {
  // Configuración HTTP
  server = app.listen(PORT, () => {
    logger.info(`🚀 Smashly API server running on port ${PORT} (HTTP)`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("🛑 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("🛑 SIGINT signal received: closing HTTP server");
  server.close(() => {
    logger.info("✅ HTTP server closed");
    process.exit(0);
  });
});

export default server;
