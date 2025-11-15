import { ApiConfig } from "../types";
import logger from "../config/logger";

// Configuración principal de la API
export const config: ApiConfig = {
  port: parseInt(process.env.PORT || "443", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin:
    process.env.NODE_ENV === "production"
      ? (process.env.FRONTEND_URL || "").split(",")
      : ["http://localhost:443", "http://localhost:5173"],
  jwtSecret: process.env.JWT_SECRET,
  database: {
    url: process.env.SUPABASE_URL || "",
    key:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
};

// Validar configuración crítica
export function validateConfig(): void {
  const requiredEnvVars = ["SUPABASE_URL"];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required"
    );
  }

  logger.info("✅ Configuration validated successfully");
}

export default config;
