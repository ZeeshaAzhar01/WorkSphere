const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers/setup');

describe('Organization Endpoints', () => {
  let userToken;
  let userId;

  beforeEach(async () => {
    await clearDatabase();
    
    // Register a user to get a token
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Org Tester',
        email: 'orgtester@example.com',
        password: 'password123'
      });
      
    userToken = res.body.token;
    userId = res.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/organizations', () => {
    it('should create an organization and assign user as OWNER', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Acme Corp'
        });
        
      expect(res.statusCode).toEqual(201);
      expect(res.body.data.organization.name).toEqual('Acme Corp');
      expect(res.body.data.organization.slug).toMatch(/^acme-corp-/);
      
      const orgId = res.body.data.organization.id;
      
      // Verify membership was created
      const membership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: orgId
          }
        }
      });
      
      expect(membership).toBeDefined();
      expect(membership.role).toEqual('OWNER');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .send({
          name: 'Acme Corp'
        });
        
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/v1/organizations', () => {
    it('should return all organizations for the user', async () => {
      // Create two orgs
      await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Org 1' });
        
      await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Org 2' });
        
      const res = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${userToken}`);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toEqual(2);
      expect(res.body.data.organizations.length).toEqual(2);
      expect(res.body.data.organizations[0].role).toEqual('OWNER');
    });
  });
});
