import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { RequestWithUser, ApiResponse } from "../types";

/**
 * export function logAuthenticatedRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user) {
    console.log(
      `🔐 Authenticated request: ${req.method} ${req.url} - User: ${req.user.email} (${req.user.id})`
    );
  }
  next();
}ara autenticar requests usando Supabase JWT
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization as string;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Token de autenticación requerido",
        message: "Debe proporcionar un token de autenticación válido",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verificar el token con Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Authentication error:", error);
      res.status(401).json({
        success: false,
        error: "Token inválido",
        message: "El token de autenticación no es válido o ha expirado",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    // Obtener el rol del usuario desde la base de datos
    console.log(`🔍 Fetching role for user ID: ${user.id}`);
    
    const { data: userData, error: dbError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log(`📊 Database query result:`, {
      userData,
      error: dbError?.message,
      roleFromDB: userData?.role,
    });

    if (dbError) {
      console.warn("⚠️ Warning: Could not fetch user role from database:", dbError.message);
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email || "",
      role: userData?.role || user.user_metadata?.role || "player",
    };

    console.log(`✅ User authenticated: ${user.email} (${req.user.role})`);

    next();
  } catch (error: any) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Error de autenticación",
      message: "Error interno en el proceso de autenticación",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
}

/**
 * Middleware opcional para autenticación (no falla si no hay token)
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization as string;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No hay token, continuar sin usuario
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Intentar verificar el token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      // Token válido, agregar usuario al request
      req.user = {
        id: user.id,
        email: user.email || "",
        role: user.user_metadata?.role || "user",
      };
    }

    // Continuar sin importar si el token es válido o no
    next();
  } catch (error: any) {
    console.error("Optional auth middleware error:", error);
    // En caso de error, continuar sin usuario
    next();
  }
}

/**
 * Middleware para verificar roles de administrador
 */
export function requireAdmin(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Autenticación requerida",
      message: "Debe estar autenticado para acceder a este recurso",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      error: "Acceso denegado",
      message:
        "Se requieren permisos de administrador para acceder a este recurso",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  next();
}

/**
 * Middleware para validar API key (alternativa a JWT para servicios)
 */
export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers["x-api-key"] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    // Si no hay API key configurada, continuar (desarrollo)
    next();
    return;
  }

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      error: "API key inválida",
      message: "Se requiere una API key válida",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  next();
}

/**
 * Middleware para logging de requests autenticados
 */
export function logAuthenticatedRequests(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void {
  if (req.user) {
    console.log(
      `🔐 Authenticated request: ${req.method} ${req.path} - User: ${req.user.email} (${req.user.id})`
    );
  }
  next();
}
