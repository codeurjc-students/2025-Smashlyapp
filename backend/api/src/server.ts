import dotenv from "dotenv";
import app from "./app";

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 443;

const server = app.listen(PORT, () => {
  console.log(`🚀 Smashly API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
});

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
