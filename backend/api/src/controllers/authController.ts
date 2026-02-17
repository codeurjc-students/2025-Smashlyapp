import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import logger from "../config/logger";
import { ApiResponse } from "../types/common";

// Helper function outside the class to avoid 'this' context issues
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class AuthController {

  /**
   * POST /api/auth/login
   * Authenticates a user and returns a JWT token
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Credentials required",
          message: "Email and password are required",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (!profileData) {
          res.status(404).json({
            success: false,
            error: "USER_NOT_FOUND",
            message: "No tienes una cuenta con este email. ¿Quieres registrarte?",
            timestamp: new Date().toISOString(),
          } as ApiResponse);
          return;
        }

        res.status(401).json({
          success: false,
          error: "INVALID_PASSWORD",
          message: "La contraseña es incorrecta. Inténtalo de nuevo.",
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
    } catch (error: unknown) {
      logger.error("Error in login:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/auth/register
   * Registers a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, nickname, full_name, role, metadata } = req.body;

      const validationError = AuthController.validateRegisterData(email, password);
      if (validationError) {
        res.status(400).json(validationError);
        return;
      }

      logger.info("Registering user with:", { email, nickname, full_name, role });

      const signUpResult = await AuthController.performSignUp(
      { email, password },
      { nickname, full_name, role, metadata }
    );
      if (signUpResult.error) {
        res.status(400).json(signUpResult.error);
        return;
      }

      await AuthController.createUserProfile(signUpResult.user, email, nickname, full_name, role);
      const finalSession = await AuthController.ensureUserSession(email, password, signUpResult.session);
      const responseData = AuthController.buildRegisterResponse(signUpResult.user, finalSession);

      res.status(201).json(responseData);
    } catch (error: unknown) {
      logger.error("Error in register:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  private static validateRegisterData(email: string, password: string): ApiResponse | null {
    if (!email || !password) {
      return {
        success: false,
        error: "Required data",
        message: "Email and password are required",
        timestamp: new Date().toISOString(),
      } as ApiResponse;
    }
    return null;
  }

  private static async performSignUp(credentials: { email: string; password: string }, userData: { nickname: string; full_name: string; role: string; metadata?: Record<string, unknown> }) {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          nickname: userData.nickname,
          full_name: userData.full_name,
          role: userData.role,
          ...(userData.metadata || {}),
        },
      },
    });

    if (error) {
      logger.error("Supabase signUp error:", error);
      return {
        error: {
          success: false,
          error: "Error registering user",
          message: getErrorMessage(error),
          timestamp: new Date().toISOString(),
        } as ApiResponse
      };
    }

    if (!data.user) {
      return {
        error: {
          success: false,
          error: "Error al crear usuario",
          message: "No se pudo crear el usuario",
          timestamp: new Date().toISOString(),
        } as ApiResponse
      };
    }

    return { user: data.user, session: data.session };
  }

  private static async createUserProfile(user: { id: string }, email: string, nickname: string, full_name: string, role: string): Promise<void> {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          email,
          nickname: nickname || email.split("@")[0],
          full_name: full_name || null,
          role: role || "player",
        })
        .select()
        .single();

      if (profileError) {
        logger.error("Error creating user profile:", profileError);
      } else {
        logger.info("User profile created:", profileData);
      }
    } catch (profileErr) {
      logger.error("Exception creating user profile:", profileErr);
    }
  }

  private static async ensureUserSession(email: string, password: string, initialSession: { access_token?: string } | null) {
    let finalSession = initialSession;

    if (!initialSession?.access_token) {
      logger.info("⚠️ No access token from signUp, attempting auto-login...");
      try {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!loginError && loginData.session) {
          logger.info("✅ Auto-login successful, got access token");
          finalSession = loginData.session;
        } else {
          logger.info("⚠️ Auto-login failed:", loginError?.message);
        }
      } catch (loginErr) {
        logger.error("Exception during auto-login:", loginErr);
      }
    }

    return finalSession;
  }

  private static buildRegisterResponse(user: any, session: any): ApiResponse {
    const responseData = {
      success: true,
      data: {
        user: {
          id: user?.id,
          email: user?.email,
          nickname: user?.user_metadata?.nickname,
          full_name: user?.user_metadata?.full_name,
          avatar_url: user?.user_metadata?.avatar_url,
          created_at: user?.created_at,
        },
        session: {
          access_token: session?.access_token,
          refresh_token: session?.refresh_token,
          expires_at: session?.expires_at,
        },
      },
      message: user?.email_confirmed_at
        ? "Usuario registrado y verificado exitosamente"
        : "Usuario registrado. Por favor, verifica tu email.",
      timestamp: new Date().toISOString(),
    } as ApiResponse;

    logger.info("📤 Sending response with access_token:", (responseData.data as any).session.access_token ? `Present (length: ${(responseData.data as any).session.access_token.length})` : "MISSING");
    logger.info("📤 Full response data keys:", responseData.data && typeof responseData.data === 'object' ? Object.keys(responseData.data) : 'No data object');

    return responseData;
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
          message: getErrorMessage(error),
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
    } catch (error: unknown) {
      logger.error("Error in logout:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
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
          message: getErrorMessage(error),
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
    } catch (error: unknown) {
      logger.error("Error in refreshToken:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
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
    } catch (error: unknown) {
      logger.error("Error in getCurrentUser:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
