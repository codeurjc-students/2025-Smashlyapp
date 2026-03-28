import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import logger from "../config/logger";
import { RequestWithUser, ApiResponse } from "../types";

/**
 * Extracts the auth token from the request.
 * Priority: httpOnly cookie > Authorization header
 * Cookie is preferred because it is inaccessible to JavaScript (XSS-safe).
 */
function extractToken(req: Request): string | null {
  // 1st: httpOnly cookie (set by backend on login, invisible to JS)
  if (req.cookies?.access_token) {
    return req.cookies.access_token as string;
  }
  // 2nd: Authorization header (backward compat for API clients / mobile)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * export function logAuthenticatedRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user) {
    logger.info(
      `🔐 Authenticated request: ${req.method} ${req.url} - User: ${req.user.email} (${req.user.id})`
    );
  }
  next();
}ara autenticar requests usando Supabase JWT
 */
function validateAuthHeader(authHeader: string | undefined, res: Response): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication token required",
      message: "You must provide a valid authentication token",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return null;
  }
  return authHeader.substring(7);
}

// Keep for backward compat but prefer extractToken() below

async function verifyToken(token: string, res: Response) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    logger.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token",
      message: "The authentication token is invalid or has expired",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return null;
  }
  return user;
}

async function fetchUserRole(userId: string) {
  logger.info(`🔍 Fetching role for user ID: ${userId}`);
  
  const { data: userData, error: dbError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  logger.info(`📊 Database query result:`, {
    userData,
    error: dbError ? getErrorMessage(dbError) : undefined,
    roleFromDB: userData?.role,
  });

  if (dbError) {
    logger.warn("⚠️ Warning: Could not fetch user role from database:", getErrorMessage(dbError));
  }

  return userData;
}

function handleAuthError(error: unknown, res: Response): void {
  logger.error("Authentication middleware error:", error);
  res.status(500).json({
    success: false,
    error: "Authentication error",
    message: "Internal error in authentication process",
    timestamp: new Date().toISOString(),
  } as ApiResponse);
}

export async function authenticateUser(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use extractToken: prefers httpOnly cookie, falls back to Authorization header
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authentication token required",
        message: "You must provide a valid authentication token",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const user = await verifyToken(token, res);
    if (!user) return;

    const userData = await fetchUserRole(user.id);

    req.user = {
      id: user.id,
      email: user.email || "",
      role: userData?.role || user.user_metadata?.role || "player",
    };

    logger.info(`✅ User authenticated: ${user.email} (${req.user.role})`);
    next();
  } catch (error: unknown) {
    handleAuthError(error, res);
  }
}

/**
 * Optional middleware for authentication (doesn't fail if no token)
 */
export async function optionalAuth(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      // No token in cookie or header, continue without user
      next();
      return;
    }

    // Try to verify the token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      // Valid token, add user to request
      req.user = {
        id: user.id,
        email: user.email || "",
        role: user.user_metadata?.role || "user",
      };
    }

    // Continue regardless of whether the token is valid or not
    next();
  } catch (error: unknown) {
    logger.error("Optional auth middleware error:", error);
    // In case of error, continue without user
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
      error: "Invalid API key",
      message: "A valid API key is required",
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
    logger.info(
      `🔐 Authenticated request: ${req.method} ${req.path} - User: ${req.user.email} (${req.user.id})`
    );
  }
  next();
}
