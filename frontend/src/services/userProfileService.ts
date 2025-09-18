import { supabase } from "../config/supabase";

// Interfaz para el perfil de usuario
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  full_name?: string;
  avatar_url?: string;
  peso?: number;
  altura?: number;
  fecha_nacimiento?: string;
  nivel_juego?: string;
  limitaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserProfileService {
  /**
   * Crea un perfil de usuario después del registro
   */
  static async createUserProfile(
    userId: string,
    email: string,
    nickname: string,
    fullName?: string
  ): Promise<UserProfile> {
    try {
      // Verificar si ya existe un perfil
      const existingProfile = await this.getUserProfile(userId);
      if (existingProfile) {
        console.log("Profile already exists for user:", userId);
        return existingProfile;
      }

      // El nickname ya fue verificado como disponible en el AuthContext
      // Solo verificamos si realmente no está disponible por race condition
      const isStillAvailable = await this.isNicknameAvailable(nickname);
      if (!isStillAvailable) {
        throw new Error(`El nickname '${nickname}' ya no está disponible`);
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          email,
          nickname: nickname,
          full_name: fullName || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user profile:", error);
        throw new Error(
          `Error al crear el perfil de usuario: ${error.message}`
        );
      }

      console.log("User profile created successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Unexpected error in createUserProfile:", error);
      if (error.message?.includes("Error al crear el perfil")) {
        throw error;
      }
      throw new Error("Error inesperado al crear el perfil de usuario");
    }
  }

  /**
   * Obtiene el perfil de un usuario por su ID
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
          // No se encontró el perfil
          console.log("User profile not found for userId:", userId);
          return null;
        }
        console.error("Error fetching user profile:", error);
        throw new Error(
          `Error al obtener el perfil de usuario: ${error.message}`
        );
      }

      return data;
    } catch (error: any) {
      console.error("Unexpected error in getUserProfile:", error);
      if (error.message?.includes("Error al obtener el perfil")) {
        throw error;
      }
      throw new Error("Error inesperado al obtener el perfil de usuario");
    }
  }

  /**
   * Actualiza el perfil de un usuario
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, "id" | "created_at">>
  ): Promise<UserProfile> {
    try {
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
          `Error al actualizar el perfil de usuario: ${error.message}`
        );
      }

      return data;
    } catch (error: any) {
      console.error("Unexpected error in updateUserProfile:", error);
      if (error.message?.includes("Error al actualizar el perfil")) {
        throw error;
      }
      throw new Error("Error inesperado al actualizar el perfil de usuario");
    }
  }

  /**
   * Verifica si un nickname ya está en uso
   */
  static async isNicknameAvailable(
    nickname: string,
    excludeUserId?: string
  ): Promise<boolean> {
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

    return data.length === 0;
  }

  /**
   * Elimina un perfil de usuario
   */
  static async deleteUserProfile(userId: string): Promise<void> {
    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Error deleting user profile:", error);
      throw new Error(
        `Error al eliminar el perfil de usuario: ${error.message}`
      );
    }
  }
}
