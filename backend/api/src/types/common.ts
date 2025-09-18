import { Request } from "express";

// Tipos generales para la API
export interface ApiResponse<T = any> {
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
  details?: any;
  timestamp: string;
}

export interface SuccessResponse<T = any> {
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
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Tipos para middleware
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
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
