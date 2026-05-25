import request from 'supertest';
import app from '../app.js';
import { connectDB, closeDB, clearDB } from './setup.js';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await closeDB();
});

beforeEach(async () => {
  await clearDB();
});

describe('Scan Endpoints', () => {
  let token;

  beforeEach(async () => {
    // Register a user and get token to access protected routes
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'scanuser',
        email: 'scan@example.com',
        password: 'password123',
      });
    token = res.body.data.token;
  });

  describe('POST /api/scan/url', () => {
    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .post('/api/scan/url')
        .send({ url: 'https://example.com' });

      expect(res.statusCode).toEqual(401);
    });

    it('should validate URL format', async () => {
      const res = await request(app)
        .post('/api/scan/url')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'invalid-url' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/scan/email', () => {
    it('should validate email text content length', async () => {
      const res = await request(app)
        .post('/api/scan/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'short' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Validation failed');
    });
  });
});
