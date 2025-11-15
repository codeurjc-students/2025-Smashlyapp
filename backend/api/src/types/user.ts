// Interface for user profile
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  full_name?: string;
  avatar_url?: string;
  weight?: number; // peso en la base de datos
  height?: number; // altura en la base de datos
  birthdate?: string; // fecha_nacimiento en la base de datos
  game_level?: string; // nivel_juego en la base de datos
  limitations?: string[]; // limitaciones en la base de datos (array)
  created_at?: string;
  updated_at?: string;
}

// Interface for creating a new user profile
export interface CreateUserProfileRequest {
  email: string;
  nickname: string;
  fullName?: string;
  weight?: number;
  height?: number;
  birthdate?: string;
  game_level?: string;
  limitations?: string[];
}

// Interface for updating a user profile
export interface UpdateUserProfileRequest {
  nickname?: string;
  full_name?: string;
  avatar_url?: string;
  weight?: number;
  height?: number;
  birthdate?: string;
  game_level?: string;
  limitations?: string[];
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
