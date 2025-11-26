import { supabase, supabaseAdmin } from "../config/supabase";
import logger from "../config/logger";
import {
  UserProfile,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
} from "../types";

export class UserService {
  /**
   * Obtiene el perfil de un usuario por ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Usuario no encontrado
        }
        logger.error("Error fetching user profile:", error);
        throw new Error(
          `Error al obtener el perfil del usuario: ${error.message}`
        );
      }

      return data;
    } catch (error: unknown) {
      logger.error("Error in getUserProfile:", error);
      throw error;
    }
  }

  /**
   * Crea un nuevo perfil de usuario
   */
  static async createUserProfile(
    userId: string,
    profileData: CreateUserProfileRequest
  ): Promise<UserProfile> {
    try {
      // Verificar si ya existe un perfil
      const existingProfile = await this.getUserProfile(userId);
      if (existingProfile) {
        logger.info("Profile already exists for user:", userId);
        return existingProfile;
      }

      // Verificar que el nickname esté disponible
      const isNicknameAvailable = await this.isNicknameAvailable(
        profileData.nickname
      );
      if (!isNicknameAvailable) {
        throw new Error(`El nickname '${profileData.nickname}' ya está en uso`);
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          email: profileData.email,
          nickname: profileData.nickname,
          full_name: profileData.fullName || "",
          weight: profileData.weight,
          height: profileData.height,
          birthdate: profileData.birthdate,
          game_level: profileData.game_level,
          limitations: profileData.limitations,
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating user profile:", error);
        throw new Error(
          `Error al crear el perfil del usuario: ${error.message}`
        );
      }

      // Create default "Favoritas" list for the new user
      // The trigger in the database should handle this automatically,
      // but we add a fallback here for safety
      try {
        const { error: listError } = await supabase
          .from("lists")
          .insert({
            user_id: userId,
            name: "Favoritas",
            description: "Mis palas favoritas",
          });

        if (listError && listError.code !== "23505") {
          // 23505 is unique constraint violation (list already exists)
          logger.warn("Error creating default favorites list:", listError);
        }
      } catch (listError) {
        // Non-critical error, just log it
        logger.warn("Failed to create default favorites list:", listError);
      }

      logger.info("✅ User profile created successfully for:", userId);
      return data;
    } catch (error: unknown) {
      logger.error("Error in createUserProfile:", error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil de un usuario
   */
  static async updateUserProfile(
    userId: string,
    updates: UpdateUserProfileRequest
  ): Promise<UserProfile> {
    try {
      // Si se está actualizando el nickname, verificar disponibilidad
      if (updates.nickname) {
        const isAvailable = await this.isNicknameAvailable(
          updates.nickname,
          userId
        );
        if (!isAvailable) {
          throw new Error(`El nickname '${updates.nickname}' ya está en uso`);
        }
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        logger.error("Error updating user profile:", error);
        throw new Error(
          `Error al actualizar el perfil del usuario: ${error.message}`
        );
      }

      return data;
    } catch (error: unknown) {
      logger.error("Error in updateUserProfile:", error);
      throw error;
    }
  }

  /**
   * Elimina el perfil de un usuario
   */
  static async deleteUserProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        logger.error("Error deleting user profile:", error);
        throw new Error(
          `Error al eliminar el perfil del usuario: ${error.message}`
        );
      }

      logger.info("✅ User profile deleted successfully for:", userId);
    } catch (error: unknown) {
      logger.error("Error in deleteUserProfile:", error);
      throw error;
    }
  }

  /**
   * Verifica si un nickname está disponible
   */
  static async isNicknameAvailable(
    nickname: string,
    excludeUserId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from("user_profiles")
        .select("id")
        .eq("nickname", nickname);

      if (excludeUserId) {
        query = query.neq("id", excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Error checking nickname availability:", error);
        throw new Error(
          `Error al verificar disponibilidad del nickname: ${error.message}`
        );
      }

      return !data || data.length === 0;
    } catch (error: unknown) {
      logger.error("Error in isNicknameAvailable:", error);
      throw error;
    }
  }

  /**
   * Busca usuarios por nickname (para funcionalidades de búsqueda)
   */
  static async searchUsersByNickname(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Partial<UserProfile>[];
    total: number;
  }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabase
        .from("user_profiles")
        .select("id, nickname, full_name, avatar_url", { count: "exact" })
        .ilike("nickname", `%${query}%`)
        .range(from, to);

      if (error) {
        logger.error("Error searching users:", error);
        throw new Error(`Error al buscar usuarios: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (error: unknown) {
      logger.error("Error in searchUsersByNickname:", error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de usuarios (solo para administradores)
   */
  static async getUserStats(): Promise<{
    total: number;
    activeThisMonth: number;
    byLevel: Record<string, number>;
  }> {
    try {
      // Usar cliente admin si está disponible
      const client = supabaseAdmin || supabase;

      const [totalResult, recentResult, levelResult] = await Promise.all([
        client
          .from("user_profiles")
          .select("id", { count: "exact", head: true }),
        client
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .gte(
            "created_at",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          ),
        client.from("user_profiles").select("game_level"),
      ]);

      const byLevel: Record<string, number> = {};
      levelResult.data?.forEach((user) => {
        const level = user.game_level || "No especificado";
        byLevel[level] = (byLevel[level] || 0) + 1;
      });

      return {
        total: totalResult.count || 0,
        activeThisMonth: recentResult.count || 0,
        byLevel,
      };
    } catch (error: unknown) {
      logger.error("Error in getUserStats:", error);
      throw error;
    }
  }

  /**
   * Valida los datos de perfil antes de crear/actualizar
   */
  static validateProfileData(data: Partial<CreateUserProfileRequest | UpdateUserProfileRequest>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    this.validateNickname(data.nickname, errors);
    // Only validate email if it's present (required for CreateUserProfileRequest, optional for UpdateUserProfileRequest)
    if ('email' in data) {
      this.validateEmail((data as CreateUserProfileRequest).email, errors);
    }
    this.validateWeight(data.weight, errors);
    this.validateHeight(data.height, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateNickname(nickname: string | undefined, errors: string[]): void {
    if (!nickname) return;
    
    if (nickname.length < 3) {
      errors.push("El nickname debe tener al menos 3 caracteres");
    }
    if (nickname.length > 50) {
      errors.push("El nickname no puede tener más de 50 caracteres");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      errors.push("El nickname solo puede contener letras, números y guiones bajos");
    }
  }

  private static validateEmail(email: string | undefined, errors: string[]): void {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Email inválido");
    }
  }

  private static validateWeight(weight: number | undefined, errors: string[]): void {
    if (weight && (weight < 30 || weight > 200)) {
      errors.push("El peso debe estar entre 30 y 200 kg");
    }
  }

  private static validateHeight(height: number | undefined, errors: string[]): void {
    if (height && (height < 100 || height > 250)) {
      errors.push("La altura debe estar entre 100 y 250 cm");
    }
  }
}
