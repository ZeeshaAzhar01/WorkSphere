const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers/setup');

describe('Project Endpoints', () => {
  let userToken;
  let orgId;

  beforeEach(async () => {
    await clearDatabase();
    
    // 1. Create a user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Project Tester',
        email: 'tester@example.com',
        password: 'password123'
      });
    userToken = userRes.body.token;

    // 2. Create an organization
    const orgRes = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ` + userToken)
      .send({ name: 'Test Org' });
    
    orgId = orgRes.body.data.organization.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/projects', () => {
    it('should create a new project in the organization', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ` + userToken)
        .set('x-organization-id', orgId)
        .send({
          name: 'Website Redesign',
          description: 'Overhaul the corporate site'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.project.name).toEqual('Website Redesign');
      expect(res.body.data.project.organizationId).toEqual(orgId);
    });

    it('should fail if x-organization-id is missing', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ` + userToken)
        .send({ name: 'Website Redesign' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/x-organization-id header/);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should get projects for the organization', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ` + userToken)
        .set('x-organization-id', orgId)
        .send({ name: 'Project A' });

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ` + userToken)
        .set('x-organization-id', orgId);

      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toEqual(1);
      expect(res.body.data.projects[0].name).toEqual('Project A');
    });
  });
});
