import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ApiResponse } from "../types";

/**
 * Schema para validar datos de perfil de usuario
 */
const userProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  nickname: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required(),
  fullName: Joi.string().optional().allow(""),
  weight: Joi.number().min(30).max(200).optional(),
  height: Joi.number().min(100).max(250).optional(),
  birthdate: Joi.string().isoDate().optional(),
  game_level: Joi.string()
    .optional()
    .valid("principiante", "intermedio", "avanzado", "profesional"),
  limitations: Joi.array().items(Joi.string()).optional(),
});

/**
 * Schema para validar actualizaciones de perfil
 */
const updateProfileSchema = Joi.object({
  nickname: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .optional(),
  full_name: Joi.string().optional().allow(""),
  avatar_url: Joi.string().uri().optional().allow(""),
  weight: Joi.number().min(30).max(200).optional(),
  height: Joi.number().min(100).max(250).optional(),
  birthdate: Joi.string().isoDate().optional(),
  game_level: Joi.string()
    .optional()
    .valid("principiante", "intermedio", "avanzado", "profesional"),
  limitations: Joi.array().items(Joi.string()).optional(),
});

/**
 * Schema para validar login
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/**
 * Schema para validar registro
 */
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  metadata: Joi.object().optional(),
});

/**
 * Schema para validar refresh token
 */
const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

/**
 * Middleware genérico para validar request body con Joi
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      res.status(400).json({
        success: false,
        error: "Datos de entrada inválidos",
        message: "Los datos proporcionados no cumplen con el formato requerido",
        details: errors,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    // Reemplazar req.body con los datos validados y limpiados
    req.body = value;
    next();
  };
}

/**
 * Middleware para validar parámetros de query de paginación
 */
export function validatePagination(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  if (req.query.page && (isNaN(page) || page < 0)) {
    res.status(400).json({
      success: false,
      error: "Parámetro de página inválido",
      message:
        'El parámetro "page" debe ser un número entero mayor o igual a 0',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    res.status(400).json({
      success: false,
      error: "Parámetro de límite inválido",
      message: 'El parámetro "limit" debe ser un número entero entre 1 y 100',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  next();
}

/**
 * Middleware para validar parámetros de ID
 */
export function validateIdParam(paramName: string = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = parseInt(req.params[paramName]);

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        error: "ID inválido",
        message: `El parámetro "${paramName}" debe ser un número entero positivo`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    next();
  };
}

/**
 * Middleware para validar parámetros de búsqueda
 */
export function validateSearchQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const query = req.query.q as string;

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: "Consulta de búsqueda inválida",
      message: 'El parámetro "q" debe ser una cadena de al menos 2 caracteres',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  next();
}

/**
 * Middleware para sanitizar y validar filtros de búsqueda
 */
export function validateSearchFilters(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const allowedFilters = [
    "marca",
    "forma",
    "balance",
    "nivel_de_juego",
    "precio_min",
    "precio_max",
    "en_oferta",
    "es_bestseller",
  ];

  const allowedSortFields = [
    "nombre",
    "marca",
    "precio_actual",
    "created_at",
    "caracteristicas_forma",
    "caracteristicas_balance",
  ];

  // Validar filtros
  for (const [key, value] of Object.entries(req.query)) {
    if (allowedFilters.includes(key)) {
      // Validaciones específicas
      if ((key === "precio_min" || key === "precio_max") && value) {
        const precio = parseFloat(value as string);
        if (isNaN(precio) || precio < 0) {
          res.status(400).json({
            success: false,
            error: "Filtro de precio inválido",
            message: `El filtro "${key}" debe ser un número positivo`,
            timestamp: new Date().toISOString(),
          } as ApiResponse);
          return;
        }
      }

      if ((key === "en_oferta" || key === "es_bestseller") && value) {
        if (value !== "true" && value !== "false") {
          res.status(400).json({
            success: false,
            error: "Filtro booleano inválido",
            message: `El filtro "${key}" debe ser "true" o "false"`,
            timestamp: new Date().toISOString(),
          } as ApiResponse);
          return;
        }
      }
    }
  }

  // Validar ordenamiento
  if (
    req.query.sortBy &&
    !allowedSortFields.includes(req.query.sortBy as string)
  ) {
    res.status(400).json({
      success: false,
      error: "Campo de ordenamiento inválido",
      message: `Los campos de ordenamiento permitidos son: ${allowedSortFields.join(
        ", "
      )}`,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  if (
    req.query.sortOrder &&
    !["asc", "desc"].includes(req.query.sortOrder as string)
  ) {
    res.status(400).json({
      success: false,
      error: "Orden inválido",
      message: 'El orden debe ser "asc" o "desc"',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  next();
}

// Exportar schemas para uso en controllers
export const schemas = {
  userProfile: userProfileSchema,
  updateProfile: updateProfileSchema,
  login: loginSchema,
  register: registerSchema,
  refreshToken: refreshTokenSchema,
};
