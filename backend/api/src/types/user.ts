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

// Interfaz para crear un nuevo perfil de usuario
export interface CreateUserProfileRequest {
  email: string;
  nickname: string;
  fullName?: string;
  peso?: number;
  altura?: number;
  fecha_nacimiento?: string;
  nivel_juego?: string;
  limitaciones?: string;
}

// Interfaz para actualizar un perfil de usuario
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

// Tipos para autenticación y autorización
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthRequest {
  user?: AuthUser;
}
