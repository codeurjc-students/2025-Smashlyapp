import { Response, NextFunction } from "express";
import { RequestWithUser } from "../types";
import logger from "../config/logger";

/**
 * Middleware to verify that the user is an administrator
 */
export const requireAdmin = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user;

    logger.info(`🔒 Checking admin access for user:`, {
      id: user?.id,
      email: user?.email,
      role: user?.role,
    });

    if (!user) {
      logger.warn("❌ Access denied: No user in request");
      res.status(401).json({
        success: false,
        error: "No autenticado",
        message: "You must log in to access this resource",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify if the user is admin (case-insensitive)
    const userRole = user.role?.toLowerCase();
    logger.info(`🔍 User role (lowercase): "${userRole}"`);

    if (userRole !== "admin") {
      logger.warn(`❌ Access denied: User role is "${user.role}", not "admin"`);
      res.status(403).json({
        success: false,
        error: "Acceso denegado",
        message: `No tienes permisos de administrador para acceder a este recurso. Tu rol actual es: ${user.role}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info("✅ Admin access granted");
    next();
  } catch (error: unknown) {
    logger.error("Error in requireAdmin middleware:", error);
    res.status(500).json({
      success: false,
      error: "Error del servidor",
      message: "Error al verificar permisos de administrador",
      timestamp: new Date().toISOString(),
    });
  }
};
