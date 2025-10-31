import { Response, NextFunction } from "express";
import { RequestWithUser } from "../types";

/**
 * Middleware para verificar que el usuario es administrador
 */
export const requireAdmin = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user;

    console.log(`🔒 Checking admin access for user:`, {
      id: user?.id,
      email: user?.email,
      role: user?.role,
    });

    if (!user) {
      console.warn("❌ Access denied: No user in request");
      res.status(401).json({
        success: false,
        error: "No autenticado",
        message: "Debes iniciar sesión para acceder a este recurso",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verificar si el usuario es admin (case-insensitive)
    const userRole = user.role?.toLowerCase();
    console.log(`🔍 User role (lowercase): "${userRole}"`);

    if (userRole !== "admin") {
      console.warn(`❌ Access denied: User role is "${user.role}", not "admin"`);
      res.status(403).json({
        success: false,
        error: "Acceso denegado",
        message: `No tienes permisos de administrador para acceder a este recurso. Tu rol actual es: ${user.role}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log("✅ Admin access granted");
    next();
  } catch (error: any) {
    console.error("Error in requireAdmin middleware:", error);
    res.status(500).json({
      success: false,
      error: "Error del servidor",
      message: "Error al verificar permisos de administrador",
      timestamp: new Date().toISOString(),
    });
  }
};
