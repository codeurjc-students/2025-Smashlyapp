import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { ApiResponse } from "../types/common";

export class AuthController {
  /**
   * POST /api/auth/login
   * Autentica un usuario con email y contraseña
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Credenciales requeridas",
          message: "Email y contraseña son requeridos",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        res.status(401).json({
          success: false,
          error: "Credenciales inválidas",
          message: error.message,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at,
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in login:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/auth/register
   * Registra un nuevo usuario
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, metadata } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Datos requeridos",
          message: "Email y contraseña son requeridos",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: "Error al registrar usuario",
          message: error.message,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
          message: data.user?.email_confirmed_at
            ? "Usuario registrado exitosamente"
            : "Usuario registrado. Revisa tu email para confirmar la cuenta.",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in register:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/auth/logout
   * Cierra la sesión del usuario
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        res.status(400).json({
          success: false,
          error: "Error al cerrar sesión",
          message: error.message,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          message: "Sesión cerrada exitosamente",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in logout:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresca el token de acceso
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: "Token de refresco requerido",
          message: "refresh_token es requerido",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        res.status(401).json({
          success: false,
          error: "Token inválido",
          message: error.message,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          session: data.session,
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at,
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in refreshToken:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/auth/me
   * Obtiene información del usuario autenticado
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({
          success: false,
          error: "Token requerido",
          message: "Authorization header con Bearer token es requerido",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const token = authHeader.split(" ")[1];

      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        res.status(401).json({
          success: false,
          error: "Token inválido",
          message: error?.message || "Usuario no encontrado",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          user: data.user,
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in getCurrentUser:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
