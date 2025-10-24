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

export interface CreateUserProfileRequest {
  nickname: string;
  full_name?: string;
  peso?: number;
  altura?: number;
  fecha_nacimiento?: string;
  nivel_juego?: string;
  limitaciones?: string;
}

export interface UpdateUserProfileRequest {
  nickname?: string;
  full_name?: string;
  avatar_url?: string;
  peso?: number;
  altura?: number;
  fecha_nacimiento?: string;
  nivel_juego?: string;
  limitaciones?: string;
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

export class UserService {
  /**
   * Obtiene el perfil del usuario autenticado desde la API REST
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_PROFILE);
      const response = await fetch(url, {
        method: "GET",
        headers: getCommonHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      return await handleApiResponse<UserProfile>(response);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      if (error.message?.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Crea un nuevo perfil de usuario desde la API REST
   */
  static async createUserProfile(
    profileData: CreateUserProfileRequest
  ): Promise<UserProfile> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_PROFILE);
      const response = await fetch(url, {
        method: "POST",
        headers: getCommonHeaders(),
        body: JSON.stringify(profileData),
      });

      return await handleApiResponse<UserProfile>(response);
    } catch (error: any) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del usuario desde la API REST
   */
  static async updateUserProfile(
    updates: UpdateUserProfileRequest
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
      throw error;
    }
  }

  /**
   * Obtiene los favoritos del usuario desde la API REST
   */
  static async getFavorites(): Promise<number[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_FAVORITES);
      const response = await fetch(url, {
        method: "GET",
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<number[]>(response);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
  }

  /**
   * Añade una pala a favoritos desde la API REST
   */
  static async addFavorite(racketId: number): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_FAVORITES);
      const response = await fetch(url, {
        method: "POST",
        headers: getCommonHeaders(),
        body: JSON.stringify({ racket_id: racketId }),
      });

      await handleApiResponse<void>(response);
    } catch (error: any) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  }

  /**
   * Elimina una pala de favoritos desde la API REST
   */
  static async removeFavorite(racketId: number): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS_FAVORITE_BY_ID(racketId));
      const response = await fetch(url, {
        method: "DELETE",
        headers: getCommonHeaders(),
      });

      await handleApiResponse<void>(response);
    } catch (error: any) {
      console.error("Error removing favorite:", error);
      throw error;
    }
  }
}
