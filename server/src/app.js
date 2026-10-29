import './config/env.js'; // Validate env vars at startup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import profileRoutes from './routes/profile.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import recommendationsRoutes from './routes/recommendations.routes.js';
import savedJobsRoutes from './routes/savedJobs.routes.js';
import applicationsRoutes from './routes/applications.routes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — only allow configured frontend origin
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Upload limit reached. Please try again in an hour.' },
});

app.use(generalLimiter);

// Health check (unauthenticated)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'careermatch-api',
    version: '1.0.0',
    env: env.NODE_ENV,
  });
});

// API routes
app.use('/api/profile', profileRoutes);
app.use('/api/resumes', uploadLimiter, resumeRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/saved-jobs', savedJobsRoutes);
app.use('/api/applications', applicationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;

