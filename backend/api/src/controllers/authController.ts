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
      const { email, password, nickname, full_name, metadata } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Datos requeridos",
          message: "Email y contraseña son requeridos",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      console.log("Registering user with:", { email, nickname, full_name });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname,
            full_name: full_name,
            ...(metadata || {}),
          },
        },
      });

      if (error) {
        console.error("Supabase signUp error:", error);
        res.status(400).json({
          success: false,
          error: "Error al registrar usuario",
          message: error.message,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      if (!data.user) {
        res.status(400).json({
          success: false,
          error: "Error al crear usuario",
          message: "No se pudo crear el usuario",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Crear perfil de usuario
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: data.user.id,
            email: email,
            nickname: nickname || email.split("@")[0],
            full_name: full_name || null,
            role: "Player",
          })
          .select()
          .single();

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          // No retornar error, el usuario ya fue creado
        } else {
          console.log("User profile created:", profileData);
        }
      } catch (profileErr) {
        console.error("Exception creating user profile:", profileErr);
      }

      // Si no hay sesión (email no confirmado), intentar hacer login automático
      let finalSession = data.session;
      let finalAccessToken = data.session?.access_token;

      if (!finalAccessToken) {
        console.log("⚠️ No access token from signUp, attempting auto-login...");
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!loginError && loginData.session) {
            console.log("✅ Auto-login successful, got access token");
            finalSession = loginData.session;
            finalAccessToken = loginData.session.access_token;
          } else {
            console.log("⚠️ Auto-login failed:", loginError?.message);
          }
        } catch (loginErr) {
          console.error("Exception during auto-login:", loginErr);
        }
      }

      const responseData = {
        success: true,
        data: {
          user: data.user,
          session: finalSession,
          access_token: finalAccessToken,
          refresh_token: finalSession?.refresh_token,
          expires_at: finalSession?.expires_at,
          message: data.user?.email_confirmed_at
            ? "Usuario registrado exitosamente"
            : "Usuario registrado. Revisa tu email para confirmar la cuenta.",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse;

      console.log("📤 Sending response with access_token:", responseData.data.access_token ? "Present (length: " + responseData.data.access_token.length + ")" : "MISSING");
      console.log("📤 Full response data keys:", Object.keys(responseData.data));

      res.status(201).json(responseData);
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
