import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { validateConfig } from './config';
import logger from './config/logger';

// Importar rutas
import racketRoutes from './routes/rackets';
import userRoutes from './routes/users';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import reviewRoutes from './routes/reviewRoutes';
import listRoutes from './routes/list';
import adminRoutes from './routes/admin';
import storeRoutes from './routes/stores';
import comparisonRoutes from './routes/comparisonRoutes';
import proxyRoutes from './routes/proxyRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import racketViewRoutes from './routes/racketViews';
import uploadRoutes from './routes/upload';
import notificationRoutes from './routes/notifications';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';

// Validar configuración al iniciar
validateConfig();

// Crear la aplicación Express
const app = express();

// Middleware de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc:
          process.env.NODE_ENV === 'production'
            ? ["'self'", 'https://accounts.google.com']
            : ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'https://lh3.googleusercontent.com'],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        connectSrc:
          process.env.NODE_ENV === 'production'
            ? ["'self'", 'https://accounts.google.com']
            : [
                "'self'",
                'https://accounts.google.com',
                'https://localhost:443',
                'http://localhost:5173',
                'https://localhost:5173',
                'ws:',
                'wss:',
              ],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
import { config } from './config';

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Límite general razonable
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 intentos por minuto
  message: {
    error: 'Demasiados intentos. Por favor, espere un minuto.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/', limiter);
app.use('/api/v1/auth/', authLimiter);

// Cookie parser (needed for httpOnly auth cookies)
app.use(cookieParser());

// Middleware general
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rutas principales
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rackets', racketRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reviews', reviewRoutes); // Rutas de reviews (monta todas las sub-rutas)
app.use('/api/v1/lists', listRoutes); // Rutas de listas
app.use('/api/v1/admin', adminRoutes); // Rutas de administración
app.use('/api/v1/stores', storeRoutes); // Rutas de tiendas
app.use('/api/v1/comparison', comparisonRoutes); // Rutas de comparación
app.use('/api/v1/proxy', proxyRoutes); // Rutas de proxy para imágenes
app.use('/api/v1/recommendations', recommendationRoutes); // Rutas de recomendaciones
app.use('/api/v1/racket-views', racketViewRoutes); // Rutas de visualizaciones de palas
app.use('/api/v1/upload', uploadRoutes); // Rutas de subida de archivos
app.use('/api/v1/notifications', notificationRoutes); // Rutas de notificaciones

// Swagger UI - servir OpenAPI spec desde docs/api-docs.yaml
try {
  // Apuntar a la carpeta docs en la raíz del proyecto (para GitHub Pages)
  const swaggerPath = path.join(__dirname, '../../../docs/api-docs.yaml');
  const swaggerDocument = YAML.load(swaggerPath);

  // UI en /api-docs
  app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Spec JSON en /api-docs/spec
  app.get('/api/v1/api-docs/spec', (req, res) => {
    res.json(swaggerDocument);
  });
} catch (err) {
  logger.warn('Swagger UI no iniciado: no se pudo cargar docs/api-docs.yaml', err);
}

// Servir frontend estático (build de Vite) desde ../static si existe
const staticDir = path.join(__dirname, '../static');
if (fs.existsSync(staticDir)) {
  // Archivos estáticos con caching diferenciado:
  // - index.html: sin caché (el SPA necesita siempre la versión más reciente)
  // - Assets con hash (JS/CSS/imágenes): caché agresiva (1 año), los nombres cambian en cada build
  app.use(
    express.static(staticDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          // HTML nunca se cachea: asegura que el usuario siempre tiene el último index.html
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (/\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|ico|webp|svg)$/.test(filePath)) {
          // Assets con hash de Vite: inmutables, cachear 1 año
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  // Fallback SPA: cualquier ruta que no empiece por /api/ devuelve index.html
  app.get(/^\/(?!api\/).*/, (req, res) => {
    // index.html no se cachea en el fallback SPA tampoco
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// Endpoint de documentación básica
app.get('/api/v1/docs', (req, res) => {
  res.json({
    title: 'Smashly API Documentation',
    version: '1.0.0',
    description: 'REST API for padel racket management system',
    endpoints: {
      health: 'GET /api/health - Health check',
      auth: {
        'POST /api/auth/login': 'Login',
        'POST /api/auth/register': 'Register user',
        'POST /api/auth/logout': 'Logout',
        'POST /api/auth/refresh': 'Refresh token',
        'GET /api/auth/me': 'Get current user',
      },
      rackets: {
        'GET /api/rackets': 'Get all rackets',
        'GET /api/rackets/:id': 'Get racket by ID',
        'GET /api/rackets/search': 'Search rackets',
        'GET /api/rackets/brands/:brand': 'Rackets by brand',
        'GET /api/rackets/bestsellers': 'Bestseller rackets',
        'GET /api/rackets/offers': 'Rackets on sale',
      },
      users: {
        'GET /api/users/profile': 'Get user profile',
        'POST /api/users/profile': 'Create user profile',
        'PUT /api/users/profile': 'Update user profile',
        'DELETE /api/users/profile': 'Delete user profile',
      },
    },
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🏓 Smashly API - Padel Racket Management System',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    health: '/api/health',
  });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/v1/health',
      '/api/v1/auth',
      '/api/v1/rackets',
      '/api/v1/users',
      '/api/v1/docs',
      '/api/v1/reviews',
    ],
  });
});

// Middleware global de manejo de errores
app.use(
  (
    err: Error & {
      isJoi?: boolean;
      details?: Array<{ message: string }>;
      code?: string;
      status?: number;
    },
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // Sanitize error logging - don't dump the whole object if it contains sensitive data
    const errorDetails = {
      message: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };

    logger.error('❌ Error:', errorDetails);

    // Error de validación de Joi
    if (err.isJoi && err.details) {
      return res.status(400).json({
        error: 'Validation error',
        details: err.details.map(detail => detail.message),
      });
    }

    // Error de Supabase
    if (err.code && err.message) {
      return res.status(400).json({
        error: 'Database error',
        message: err.message,
        code: err.code,
      });
    }

    // Error genérico
    return res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
);

export default app;
