import { Request } from "express";

// Tipos generales para la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

// Tipos para validación
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Tipo para manejo de errores
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// Tipos para middleware
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  file?: Express.Multer.File; // Para manejar uploads de archivos
}

// Tipos para configuración
export interface DatabaseConfig {
  url: string;
  key: string;
}

export interface ApiConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string[];
  jwtSecret?: string;
  database: DatabaseConfig;
  gemini?: {
    apiKey: string;
  };
}
