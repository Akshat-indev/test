// Set test env vars before any module imports
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.SUPABASE_URL = 'https://placeholder.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'placeholder-service-key';

import request from 'supertest';
import app from '../src/app.js';

// Mock authenticate middleware for protected route tests
jest.mock('../src/middleware/authenticate.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'user-a-uuid-1234', email: 'usera@test.com' };
    next();
  },
}));

// Mock supabase to avoid real network calls
jest.mock('../src/config/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('API Routes', () => {
  describe('GET /health', () => {
    test('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('careermatch-api');
    });
  });

  describe('GET /api/jobs', () => {
    test('returns jobs list with isDemo flag', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('jobs');
      expect(Array.isArray(res.body.jobs)).toBe(true);
      expect(res.body).toHaveProperty('isDemo');
    });

    test('filters demo jobs by location (Mumbai)', async () => {
      const res = await request(app)
        .get('/api/jobs?location=Mumbai')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.jobs)).toBe(true);
    });
  });

  describe('GET /api/jobs/locations', () => {
    test('returns supported locations without auth', async () => {
      const res = await request(app).get('/api/jobs/locations');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('locations');
      expect(Array.isArray(res.body.locations)).toBe(true);
      expect(res.body.locations.length).toBeGreaterThan(0);
    });
  });

  describe('Route protection', () => {
    test('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
