import { env } from '../config/env.js';

/**
 * Centralized error handler. Must be registered after all routes.
 * Strips stack traces in production and never leaks secrets.
 */
export function errorHandler(err, req, res, next) {
  const isDev = env.NODE_ENV === 'development';
  const status = err.status || err.statusCode || 500;

  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
}

