const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers/setup');

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toEqual('test@example.com');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 if email is already in use', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
        
      // Second registration with same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password123'
        });
        
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Email already in use/);
    });
    
    it('should return 400 on validation error (short password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'short'
        });
        
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Validation failed/);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a user to test login against
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Login User',
          email: 'login@example.com',
          password: 'password123'
        });
    });

    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toEqual('login@example.com');
    });

    it('should return 401 with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });
        
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toMatch(/Invalid email or password/);
    });
  });
});
