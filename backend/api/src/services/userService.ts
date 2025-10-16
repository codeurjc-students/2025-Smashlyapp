import { supabase, supabaseAdmin } from "../config/supabase";
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
        console.error("Error fetching user profile:", error);
        throw new Error(
          `Error al obtener el perfil del usuario: ${error.message}`
        );
      }

      return data;
    } catch (error: any) {
      console.error("Error in getUserProfile:", error);
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
        console.log("Profile already exists for user:", userId);
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
        console.error("Error creating user profile:", error);
        throw new Error(
          `Error al crear el perfil del usuario: ${error.message}`
        );
      }

      console.log("✅ User profile created successfully for:", userId);
      return data;
    } catch (error: any) {
      console.error("Error in createUserProfile:", error);
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
        console.error("Error updating user profile:", error);
        throw new Error(
          `Error al actualizar el perfil del usuario: ${error.message}`
        );
      }

      return data;
    } catch (error: any) {
      console.error("Error in updateUserProfile:", error);
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
        console.error("Error deleting user profile:", error);
        throw new Error(
          `Error al eliminar el perfil del usuario: ${error.message}`
        );
      }

      console.log("✅ User profile deleted successfully for:", userId);
    } catch (error: any) {
      console.error("Error in deleteUserProfile:", error);
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
        console.error("Error checking nickname availability:", error);
        throw new Error(
          `Error al verificar disponibilidad del nickname: ${error.message}`
        );
      }

      return !data || data.length === 0;
    } catch (error: any) {
      console.error("Error in isNicknameAvailable:", error);
      throw error;
    }
  }

  /**
   * Busca usuarios por nickname (para funcionalidades de búsqueda)
   */
  static async searchUsersByNickname(
    query: string,
    limit: number = 10
  ): Promise<Partial<UserProfile>[]> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, nickname, full_name, avatar_url")
        .ilike("nickname", `%${query}%`)
        .limit(limit);

      if (error) {
        console.error("Error searching users:", error);
        throw new Error(`Error al buscar usuarios: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in searchUsersByNickname:", error);
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
    } catch (error: any) {
      console.error("Error in getUserStats:", error);
      throw error;
    }
  }

  /**
   * Valida los datos de perfil antes de crear/actualizar
   */
  static validateProfileData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (data.nickname && data.nickname.length < 3) {
      errors.push("El nickname debe tener al menos 3 caracteres");
    }

    if (data.nickname && data.nickname.length > 50) {
      errors.push("El nickname no puede tener más de 50 caracteres");
    }

    if (data.nickname && !/^[a-zA-Z0-9_]+$/.test(data.nickname)) {
      errors.push(
        "El nickname solo puede contener letras, números y guiones bajos"
      );
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Email inválido");
    }

    if (data.weight && (data.weight < 30 || data.weight > 200)) {
      errors.push("El peso debe estar entre 30 y 200 kg");
    }

    if (data.height && (data.height < 100 || data.height > 250)) {
      errors.push("La altura debe estar entre 100 y 250 cm");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
