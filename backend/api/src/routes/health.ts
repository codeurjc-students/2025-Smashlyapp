import { Router, Request, Response } from "express";
import { testSupabaseConnection } from "../config/supabase";
import logger from "../config/logger";

const router = Router();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  return {
    used: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
    total: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
    unit: "MB",
  };
}

function createHealthStatus(dbConnected: boolean, responseTime: number) {
  return {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    services: {
      database: {
        status: dbConnected ? "connected" : "disconnected",
        type: "Supabase",
      },
      ai: {
        status: process.env.GEMINI_API_KEY ? "configured" : "not_configured",
        type: "Google Gemini",
      },
    },
    performance: {
      responseTime: `${responseTime}ms`,
      memoryUsage: getMemoryUsage(),
    },
  };
}

function createErrorResponse(error: unknown) {
  return {
    success: false,
    data: {
      status: "ERROR",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      error: getErrorMessage(error),
    },
    message: "Health check failed",
  };
}

function checkEnvironmentVariables() {
  return {
    supabaseUrl: !!process.env.SUPABASE_URL,
    supabaseKey: !!(
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    ),
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

function getDetailedMemoryUsage() {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
    external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
    unit: "MB",
  };
}

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const dbConnectionResult = await testSupabaseConnection();
    const responseTime = Date.now() - startTime;
    const healthStatus = createHealthStatus(dbConnectionResult.success, responseTime);
    const statusCode = dbConnectionResult.success ? 200 : 503;

    res.status(statusCode).json({
      success: dbConnectionResult.success,
      data: healthStatus,
      message: dbConnectionResult.success
        ? "All systems operational"
        : "Database connection failed",
    });
  } catch (error: unknown) {
    logger.error("Health check error:", error);
    res.status(503).json(createErrorResponse(error));
  }
});

/**
 * GET /api/health/deep
 * Deep health check with more detailed tests
 */
router.get("/deep", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const checks: Record<string, unknown> = {};

    // Database check
    let databaseConnected = false;
    try {
      const dbResult = await testSupabaseConnection();
      checks.database = dbResult;
      databaseConnected = dbResult.success;
    } catch (error: unknown) {
      checks.database = { success: false, message: getErrorMessage(error) };
      checks.databaseError = getErrorMessage(error);
    }

    const environmentChecks = checkEnvironmentVariables();
    checks.environment = environmentChecks;
    checks.memory = getDetailedMemoryUsage();

    const responseTime = Date.now() - startTime;
    const allSystemsOk =
      databaseConnected &&
      environmentChecks.supabaseUrl &&
      environmentChecks.supabaseKey;

    res.status(allSystemsOk ? 200 : 503).json({
      success: allSystemsOk,
      data: {
        ...checks,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      message: allSystemsOk
        ? "Deep health check passed"
        : "Some systems not operational",
    });
  } catch (error: unknown) {
    logger.error("Deep health check error:", error);

    res.status(503).json({
      success: false,
      error: "Deep health check failed",
      message: getErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
