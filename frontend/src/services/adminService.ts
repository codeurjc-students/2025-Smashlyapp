import {
  API_ENDPOINTS,
  buildApiUrl,
  getCommonHeaders,
  ApiResponse,
} from "../config/api";

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

// Interfaces
export interface AdminMetrics {
  totalUsers: number;
  totalRackets: number;
  totalStores: number;
  totalReviews: number;
  pendingRequests: number;
  activeUsers: number;
  totalFavorites: number;
  usersChange: number;
  racketsChange: number;
}

export interface AdminUser {
  id: string;
  email: string;
  nickname: string;
  full_name?: string;
  role: "admin" | "player";
  created_at: string;
}

export interface StoreRequest {
  id: string;
  store_name: string;
  legal_name: string;
  cif_nif: string;
  contact_email: string;
  phone_number: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  location: string;
  verified: boolean;
  admin_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface RacketRequest {
  id: number;
  nombre: string;
  marca: string;
  precio_actual: number;
  forma?: string;
  balance?: string;
  status: "pending" | "approved" | "rejected";
  requester?: string;
  requestDate?: string;
}

export class AdminService {
  /**
   * Obtiene las métricas del dashboard de admin
   */
  static async getDashboardMetrics(): Promise<AdminMetrics> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.METRICS), {
      method: "GET",
      headers: getCommonHeaders(),
    });

    return handleApiResponse<AdminMetrics>(response);
  }

  /**
   * Obtiene todos los usuarios
   */
  static async getAllUsers(): Promise<AdminUser[]> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USERS), {
      method: "GET",
      headers: getCommonHeaders(),
    });

    return handleApiResponse<AdminUser[]>(response);
  }

  /**
   * Actualiza el rol de un usuario
   */
  static async updateUserRole(
    userId: string,
    role: "admin" | "player"
  ): Promise<AdminUser> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/role`),
      {
        method: "PATCH",
        headers: getCommonHeaders(),
        body: JSON.stringify({ role }),
      }
    );

    return handleApiResponse<AdminUser>(response);
  }

  /**
   * Elimina un usuario
   */
  static async deleteUser(userId: string): Promise<void> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`),
      {
        method: "DELETE",
        headers: getCommonHeaders(),
      }
    );

    await handleApiResponse<void>(response);
  }

  /**
   * Obtiene todas las solicitudes de tiendas
   */
  static async getStoreRequests(): Promise<StoreRequest[]> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.ADMIN.STORE_REQUESTS),
      {
        method: "GET",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<StoreRequest[]>(response);
  }

  /**
   * Aprueba una solicitud de tienda
   */
  static async approveStoreRequest(requestId: number): Promise<StoreRequest> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.STORE_REQUESTS}/${requestId}/approve`),
      {
        method: "POST",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<StoreRequest>(response);
  }

  /**
   * Rechaza una solicitud de tienda
   */
  static async rejectStoreRequest(requestId: number): Promise<StoreRequest> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.STORE_REQUESTS}/${requestId}/reject`),
      {
        method: "POST",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<StoreRequest>(response);
  }

  /**
   * Obtiene todas las solicitudes de palas
   */
  static async getRacketRequests(): Promise<RacketRequest[]> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.ADMIN.RACKET_REQUESTS),
      {
        method: "GET",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<RacketRequest[]>(response);
  }

  /**
   * Aprueba una solicitud de pala
   */
  static async approveRacketRequest(
    requestId: number
  ): Promise<RacketRequest> {
    const response = await fetch(
      buildApiUrl(
        `${API_ENDPOINTS.ADMIN.RACKET_REQUESTS}/${requestId}/approve`
      ),
      {
        method: "POST",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<RacketRequest>(response);
  }

  /**
   * Rechaza una solicitud de pala
   */
  static async rejectRacketRequest(requestId: number): Promise<RacketRequest> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.RACKET_REQUESTS}/${requestId}/reject`),
      {
        method: "POST",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<RacketRequest>(response);
  }

  /**
   * Crea una nueva pala
   */
  static async createRacket(racketData: any): Promise<any> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.RACKETS), {
      method: "POST",
      headers: getCommonHeaders(),
      body: JSON.stringify(racketData),
    });

    return handleApiResponse<any>(response);
  }

  /**
   * Actualiza una pala existente
   */
  static async updateRacket(racketId: number, racketData: any): Promise<any> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.RACKETS}/${racketId}`),
      {
        method: "PUT",
        headers: getCommonHeaders(),
        body: JSON.stringify(racketData),
      }
    );

    return handleApiResponse<any>(response);
  }

  /**
   * Elimina una pala
   */
  static async deleteRacket(racketId: number): Promise<void> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.RACKETS}/${racketId}`),
      {
        method: "DELETE",
        headers: getCommonHeaders(),
      }
    );

    await handleApiResponse<void>(response);
  }

  /**
   * Verifica/aprueba una tienda
   */
  static async verifyStore(storeId: string): Promise<any> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.ADMIN.VERIFY_STORE(storeId)),
      {
        method: "POST",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<any>(response);
  }

  /**
   * Rechaza una solicitud de tienda
   */
  static async rejectStore(storeId: string): Promise<void> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.ADMIN.REJECT_STORE(storeId)),
      {
        method: "DELETE",
        headers: getCommonHeaders(),
      }
    );

    await handleApiResponse<void>(response);
  }

  /**
   * Obtiene la actividad reciente del sistema
   */
  static async getRecentActivity(limit: number = 10): Promise<Activity[]> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.ADMIN.RECENT_ACTIVITY, { limit }),
      {
        method: "GET",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<Activity[]>(response);
  }

  /**
   * Obtiene los conflictos de palas pendientes de revisión
   */
  static async getRacketConflicts(): Promise<any[]> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.ADMIN.CONFLICTS),
      {
        method: "GET",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<any[]>(response);
  }

  /**
   * Resuelve un conflicto de pala
   */
  static async resolveRacketConflict(
    racketId: number, 
    action: 'replace' | 'reject' | 'keep_both'
  ): Promise<void> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.ADMIN.RESOLVE_CONFLICT(racketId)),
      {
        method: "POST",
        headers: getCommonHeaders(),
        body: JSON.stringify({ action })
      }
    );

    await handleApiResponse<void>(response);
  }
}

export interface Activity {
  id: string;
  type: 'user' | 'racket' | 'review' | 'store';
  title: string;
  time: string;
  icon: string;
}
