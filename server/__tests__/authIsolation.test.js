// Set test env vars before any module imports
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.SUPABASE_URL = 'https://placeholder.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'placeholder-service-key';

import request from 'supertest';
import app from '../src/app.js';

const USER_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const USER_B = 'bbbbbbbb-0000-0000-0000-000000000002';
const USER_B_RESUME_ID = 'cccccccc-0000-0000-0000-000000000003';
const USER_B_APP_ID = 'dddddddd-0000-0000-0000-000000000004';

// Mock supabase: returns records owned by User B
jest.mock('../src/config/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: USER_A } }, error: null }),
    },
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      // Returns record owned by User B for any single() or maybeSingle()
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: USER_B_RESUME_ID,
          user_id: USER_B,
          status: 'applied',
        },
        error: null,
      }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  },
}));

// User A is signed in
jest.mock('../src/middleware/authenticate.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: USER_A, email: 'usera@test.com' };
    next();
  },
}));

describe('Authorization Isolation', () => {
  test('User A cannot delete User B\'s resume (403)', async () => {
    const res = await request(app)
      .delete(`/api/resumes/${USER_B_RESUME_ID}`)
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Access denied');
  });

  test('User A cannot update User B\'s application (403)', async () => {
    const res = await request(app)
      .patch(`/api/applications/${USER_B_APP_ID}`)
      .set('Authorization', 'Bearer user-a-token')
      .send({ status: 'applied' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Access denied');
  });

  test('User A cannot delete User B\'s application (403)', async () => {
    const res = await request(app)
      .delete(`/api/applications/${USER_B_APP_ID}`)
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Access denied');
  });
});
