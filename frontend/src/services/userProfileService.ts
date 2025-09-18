import { apiRequest } from "../config/api";

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
   * Obtiene el perfil del usuario autenticado
   */
  static async getUserProfile(token: string): Promise<UserProfile | null> {
    try {
      const response = await apiRequest('/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data || response || null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Crea un perfil de usuario después del registro
   */
  static async createUserProfile(
    token: string,
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const response = await apiRequest('/users/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      return response.data || response;
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw new Error(`Error al crear perfil: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Actualiza el perfil del usuario autenticado
   */
  static async updateUserProfile(
    token: string,
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const response = await apiRequest('/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      return response.data || response;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error(`Error al actualizar perfil: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Verifica si un nickname está disponible
   */
  static async isNicknameAvailable(nickname: string): Promise<boolean> {
    try {
      const response = await apiRequest(`/users/check-nickname?nickname=${encodeURIComponent(nickname)}`);
      return response.available || false;
    } catch (error) {
      console.error("Error checking nickname availability:", error);
      // En caso de error, asumimos que no está disponible por seguridad
      return false;
    }
  }

  /**
   * Elimina el perfil del usuario autenticado
   */
  static async deleteUserProfile(token: string): Promise<boolean> {
    try {
      await apiRequest('/users/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return true;
    } catch (error) {
      console.error("Error deleting user profile:", error);
      return false;
    }
  }
}
