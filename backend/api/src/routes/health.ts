import { Router, Request, Response } from "express";
import { testSupabaseConnection } from "../config/supabase";

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const dbConnected = await testSupabaseConnection();

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const healthStatus = {
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
        memoryUsage: {
          used:
            Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
            100,
          total:
            Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
            100,
          unit: "MB",
        },
      },
    };

    const statusCode = dbConnected ? 200 : 503;

    res.status(statusCode).json({
      success: dbConnected,
      data: healthStatus,
      message: dbConnected
        ? "All systems operational"
        : "Database connection failed",
    });
  } catch (error: any) {
    console.error("Health check error:", error);

    res.status(503).json({
      success: false,
      data: {
        status: "ERROR",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0",
        error: error.message,
      },
      message: "Health check failed",
    });
  }
});

/**
 * GET /api/health/deep
 * Deep health check with more detailed tests
 */
router.get("/deep", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const checks: any = {};

    // Database check
    try {
      checks.database = await testSupabaseConnection();
    } catch (error: any) {
      checks.database = false;
      checks.databaseError = error.message;
    }

    // Environment variables check
    checks.environment = {
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!(
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      ),
      geminiApiKey: !!process.env.GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV || "development",
    };

    // Memory check
    const memUsage = process.memoryUsage();
    checks.memory = {
      heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
      unit: "MB",
    };

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const allSystemsOk =
      checks.database &&
      checks.environment.supabaseUrl &&
      checks.environment.supabaseKey;

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
  } catch (error: any) {
    console.error("Deep health check error:", error);

    res.status(503).json({
      success: false,
      error: "Deep health check failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
