import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types';

/**
 * Schema for validating user profile data
 */
const userProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  nickname: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required(),
  fullName: Joi.string().optional().allow(''),
  weight: Joi.number().min(30).max(200).optional(),
  height: Joi.number().min(100).max(250).optional(),
  birthdate: Joi.string().isoDate().optional(),
  game_level: Joi.string()
    .optional()
    .valid('Principiante', 'Intermedio', 'Avanzado', 'Profesional'),
  limitations: Joi.array().items(Joi.string()).optional(),
});

/**
 * Schema for validating profile updates
 */
const updateProfileSchema = Joi.object({
  nickname: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .optional(),
  full_name: Joi.string().optional().allow(''),
  avatar_url: Joi.string().uri().optional().allow(''),
  weight: Joi.number().min(30).max(200).optional(),
  height: Joi.number().min(100).max(250).optional(),
  birthdate: Joi.string().isoDate().optional(),
  game_level: Joi.string()
    .optional()
    .valid('Principiante', 'Intermedio', 'Avanzado', 'Profesional'),
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
  nickname: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required(),
  full_name: Joi.string().optional().allow(''),
  role: Joi.string().valid('player', 'store_owner').required(),
  metadata: Joi.object().optional(),
});

/**
 * Schema para validar refresh token
 */
const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

/**
 * Generic middleware to validate request body with Joi
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        message: 'The provided data does not meet the required format',
        details: errors,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    // Replace req.body with validated and cleaned data
    req.body = value;
    next();
  };
}

/**
 * Middleware to validate pagination query parameters
 */
export function validatePagination(req: Request, res: Response, next: NextFunction): void {
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  if (req.query.page && (isNaN(page) || page < 0)) {
    res.status(400).json({
      success: false,
      error: 'Invalid page parameter',
      message: 'The "page" parameter must be an integer greater than or equal to 0',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    res.status(400).json({
      success: false,
      error: 'Invalid limit parameter',
      message: 'The "limit" parameter must be an integer between 1 and 100',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  next();
}

/**
 * Middleware to validate ID parameters
 */
export function validateIdParam(
  paramName: string = 'id'
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = parseInt(req.params[paramName]);

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `The parameter "${paramName}" must be a positive integer`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    req.params[paramName] = id.toString();
    next();
  };
}

/**
 * Middleware to validate search parameters
 */
export function validateSearchQuery(req: Request, res: Response, next: NextFunction): void {
  const query = req.query.q as string;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: 'Invalid search query',
      message: 'The "q" parameter must be a string of at least 2 characters',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  next();
}

/**
 * Middleware to sanitize and validate search filters
 */
function validatePriceFilter(key: string, value: string, res: Response): boolean {
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue < 0) {
    res.status(400).json({
      success: false,
      error: 'Invalid price filter',
      message: `The filter "${key}" must be a positive number`,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return false;
  }
  return true;
}

function validateBooleanFilter(key: string, value: string, res: Response): boolean {
  const validValues = ['true', 'false', '1', '0'];
  if (!validValues.includes(value.toLowerCase())) {
    res.status(400).json({
      success: false,
      error: 'Invalid boolean filter',
      message: `El filtro "${key}" debe ser "true" o "false"`,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return false;
  }
  return true;
}

function validateSortBy(sortBy: string, allowedFields: string[], res: Response): boolean {
  if (!allowedFields.includes(sortBy)) {
    res.status(400).json({
      success: false,
      error: 'Invalid sort field',
      message: `Allowed sorting fields are: ${allowedFields.join(', ')}`,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return false;
  }
  return true;
}

function validateSortOrder(sortOrder: string, res: Response): boolean {
  if (!['asc', 'desc'].includes(sortOrder)) {
    res.status(400).json({
      success: false,
      error: 'Invalid sort order',
      message: 'Order must be "asc" or "desc"',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return false;
  }
  return true;
}

function validateQueryFilters(
  query: Record<string, unknown>,
  allowedFilters: string[],
  res: Response
): boolean {
  for (const [key, value] of Object.entries(query)) {
    if (allowedFilters.includes(key) && value) {
      if (key === 'min_price' || key === 'max_price') {
        if (!validatePriceFilter(key, value as string, res)) return false;
      }

      if (key === 'on_offer' || key === 'is_bestseller') {
        if (!validateBooleanFilter(key, value as string, res)) return false;
      }
    }
  }
  return true;
}

export function validateSearchFilters(req: Request, res: Response, next: NextFunction): void {
  const allowedFilters = [
    'brand',
    'shape',
    'balance',
    'game_level',
    'min_price',
    'max_price',
    'on_offer',
    'is_bestseller',
  ];

  const allowedSortFields = [
    'name',
    'brand',
    'current_price',
    'created_at',
    'characteristics_shape',
    'characteristics_balance',
  ];

  // Validar filtros
  if (!validateQueryFilters(req.query, allowedFilters, res)) {
    return;
  }

  // Validar ordenamiento
  if (req.query.sortBy && !validateSortBy(req.query.sortBy as string, allowedSortFields, res)) {
    return;
  }

  if (req.query.sortOrder && !validateSortOrder(req.query.sortOrder as string, res)) {
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
