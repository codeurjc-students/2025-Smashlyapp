import {
  API_ENDPOINTS,
  buildApiUrl,
  getCommonHeaders,
  ApiResponse,
} from "../config/api";

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

/**
 * Helper para manejar respuestas de la API
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.message || data.error || "Error desconocido");
  }

  return data.data as T;
}

export class UserProfileService {
  /**
   * Crea un perfil de usuario después del registro
   * Nota: El backend ya maneja la verificación de perfiles existentes y nicknames
   * El userId se obtiene del token JWT en el backend
   */
  static async createUserProfile(
    nickname: string,
    fullName?: string
  ): Promise<UserProfile> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_PROFILE);
      const response = await fetch(url, {
        method: "POST",
        headers: getCommonHeaders(),
        body: JSON.stringify({
          nickname,
          full_name: fullName || "",
        }),
      });

      const profile = await handleApiResponse<UserProfile>(response);
      console.log("User profile created successfully:", profile);
      return profile;
    } catch (error: any) {
      console.error("Error creating user profile:", error);
      if (error.message?.includes("nickname")) {
        throw new Error(`El nickname '${nickname}' ya no está disponible`);
      }
      throw new Error(error.message || "Error inesperado al crear el perfil de usuario");
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado desde la API REST
   * El userId se obtiene del token JWT en el backend
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_PROFILE);
      const response = await fetch(url, {
        method: "GET",
        headers: getCommonHeaders(),
      });

      if (response.status === 404) {
        console.log("User profile not found");
        return null;
      }

      return await handleApiResponse<UserProfile>(response);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      if (error.message?.includes("404")) {
        return null;
      }
      throw new Error(error.message || "Error inesperado al obtener el perfil de usuario");
    }
  }

  /**
   * Actualiza el perfil del usuario autenticado
   * El userId se obtiene del token JWT en el backend
   */
  static async updateUserProfile(
    updates: Partial<Omit<UserProfile, "id" | "created_at">>
  ): Promise<UserProfile> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_PROFILE);
      const response = await fetch(url, {
        method: "PUT",
        headers: getCommonHeaders(),
        body: JSON.stringify(updates),
      });

      return await handleApiResponse<UserProfile>(response);
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      throw new Error(error.message || "Error inesperado al actualizar el perfil de usuario");
    }
  }

  /**
   * Verifica si un nickname ya está en uso
   * Nota: Esta funcionalidad debería implementarse en el backend
   * Por ahora, intentamos crear/actualizar y manejamos el error
   */
  static async isNicknameAvailable(): Promise<boolean> {
    try {
      // TODO: Implementar endpoint en backend para verificar disponibilidad
      // Por ahora asumimos que está disponible hasta que se intente usar
      console.warn("isNicknameAvailable: Esta funcionalidad debe implementarse en el backend");
      return true;
    } catch (error: any) {
      console.error("Error checking nickname availability:", error);
      throw new Error(error.message || "Error al verificar disponibilidad del nickname");
    }
  }

  /**
   * Elimina el perfil del usuario autenticado
   * Nota: Esta funcionalidad debería implementarse en el backend
   * El userId se obtiene del token JWT en el backend
   */
  static async deleteUserProfile(): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_PROFILE);
      const response = await fetch(url, {
        method: "DELETE",
        headers: getCommonHeaders(),
      });

      await handleApiResponse<void>(response);
    } catch (error: any) {
      console.error("Error deleting user profile:", error);
      throw new Error(error.message || "Error al eliminar el perfil de usuario");
    }
  }
}
