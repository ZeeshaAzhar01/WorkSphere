const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers/setup');

describe('Billing Endpoints', () => {
  let ownerToken;
  let ownerId;
  let orgId;

  beforeEach(async () => {
    await clearDatabase();
    
    // Create user
    const ownerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Billing Owner',
        email: 'billing@example.com',
        password: 'password123'
      });
    ownerToken = ownerRes.body.token;
    ownerId = ownerRes.body.data.user.id;

    // Create org (should automatically attach FREE plan)
    const orgRes = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', 'Bearer ' + ownerToken)
      .send({ name: 'Billing Org' });
    orgId = orgRes.body.data.organization.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/billing/subscription', () => {
    it('should return the current subscription details', async () => {
      const res = await request(app)
        .get('/api/v1/billing/subscription')
        .set('Authorization', 'Bearer ' + ownerToken)
        .set('x-organization-id', orgId);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.subscription.status).toEqual('ACTIVE');
      expect(res.body.data.subscription.plan.name).toEqual('FREE');
    });
  });

  describe('POST /api/v1/billing/checkout', () => {
    it('should return a test checkout url', async () => {
      const res = await request(app)
        .post('/api/v1/billing/checkout')
        .set('Authorization', 'Bearer ' + ownerToken)
        .set('x-organization-id', orgId)
        .send({ priceId: 'price_mock_123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.url).toContain('checkout.stripe.com');
    });
  });

  describe('Plan Limits Enforcement', () => {
    it('should block creating projects beyond maxProjects limit', async () => {
      // FREE plan maxProjects is 3
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer ' + ownerToken)
          .set('x-organization-id', orgId)
          .send({ name: `Project ${i}` });
        expect(res.statusCode).toEqual(201);
      }

      // 4th project should fail
      const failRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', 'Bearer ' + ownerToken)
        .set('x-organization-id', orgId)
        .send({ name: `Project 4` });

      expect(failRes.statusCode).toEqual(403);
      expect(failRes.body.message).toMatch(/Upgrade required/);
    });
  });
});