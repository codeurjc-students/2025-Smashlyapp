/**
 * API Configuration
 * Configuración centralizada para las llamadas a la API REST
 */

// URL base de la API
export const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

// Endpoints de la API
export const API_ENDPOINTS = {
  // Rackets
  RACKETS: "/api/v1/rackets",
  RACKETS_BY_ID: (id: number) => `/api/v1/rackets/${id}`,
  RACKETS_SEARCH: "/api/v1/rackets/search",
  RACKETS_FILTER: "/api/v1/rackets/filter",
  RACKETS_BESTSELLERS: "/api/v1/rackets/bestsellers",
  RACKETS_OFFERS: "/api/v1/rackets/offers",
  RACKETS_BRANDS: "/api/v1/rackets/brands",
  RACKETS_STATS: "/api/v1/rackets/stats",
  RACKETS_BY_BRAND: (brand: string) => `/api/v1/rackets/brands/${brand}`,

  // Users
  USERS_PROFILE: "/api/v1/users/profile",
  USERS_FAVORITES: "/api/v1/users/favorites",
  USERS_FAVORITE_BY_ID: (id: number) => `/api/v1/users/favorites/${id}`,

  // Auth
  AUTH_LOGIN: "/api/v1/auth/login",
  AUTH_REGISTER: "/api/v1/auth/register",
  AUTH_LOGOUT: "/api/v1/auth/logout",
  AUTH_ME: "/api/v1/auth/me",

  // Health
  HEALTH: "/api/v1/health",
} as const;

/**
 * Helper para construir URLs completas
 */
export const buildApiUrl = (
  endpoint: string,
  params?: Record<string, any>
): string => {
  const url = new URL(endpoint, API_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};

/**
 * Helper para obtener el token de autenticación
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

/**
 * Helper para configurar headers comunes
 */
export const getCommonHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Tipo para respuestas de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Tipo para respuestas paginadas
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
