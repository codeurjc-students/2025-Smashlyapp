import dotenv from "dotenv";
import https from "https";
import fs from "fs";
import path from "path";
import app from "./app";

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
    console.error("❌ Error: No se encontraron los certificados SSL");
    console.error(`   Cert path: ${certPath}`);
    console.error(`   Key path: ${keyPath}`);
    console.error("   Por favor, genera los certificados SSL primero.");
    process.exit(1);
  }

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  server = https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🚀 Smashly API server running on port ${PORT} (HTTPS)`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Health check: https://localhost:${PORT}/api/v1/health`);
    console.log(`📚 API Documentation: https://localhost:${PORT}/api/v1/docs`);
  });
} else {
  // Configuración HTTP
  server = app.listen(PORT, () => {
    console.log(`🚀 Smashly API server running on port ${PORT} (HTTP)`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

export default server;
