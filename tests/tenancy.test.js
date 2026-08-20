const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers/setup');

describe('Cross-Tenant Data Isolation', () => {
  let userAToken, userBToken;
  let orgAId, orgBId;
  let projectAId;

  beforeAll(async () => {
    await clearDatabase();
    
    // 1. Setup User A and Org A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'User A', email: 'usera@example.com', password: 'password123'
    });
    userAToken = resA.body.token;

    const resOrgA = await request(app).post('/api/v1/organizations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Org A' });
    orgAId = resOrgA.body.data.organization.id;

    // 2. Setup User B and Org B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'User B', email: 'userb@example.com', password: 'password123'
    });
    userBToken = resB.body.token;

    const resOrgB = await request(app).post('/api/v1/organizations')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Org B' });
    orgBId = resOrgB.body.data.organization.id;

    // 3. User A creates a project in Org A
    const resProject = await request(app).post('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .set('x-organization-id', orgAId)
      .send({ name: 'Project A', description: 'Top Secret' });
    projectAId = resProject.body.data.project.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Isolation Checks', () => {
    it('should deny User B from accessing Project A by passing Org A in header', async () => {
      // User B attempts to say they are in Org A to view Project A
      const res = await request(app).get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('x-organization-id', orgAId);

      // The tenantContext middleware should block this (403 or 401) because User B is not a member of Org A
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toMatch(/do not belong/i);
    });

    it('should not find Project A if User B passes their own Org B in header', async () => {
      // User B passes their valid org (Org B) but asks for Project A's ID
      const res = await request(app).get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('x-organization-id', orgBId);

      // The service layer should not find the project because the query includes `organizationId: orgBId`
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should deny User B from modifying Project A', async () => {
      const res = await request(app).put(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('x-organization-id', orgBId) // Using valid org context for User B
        .send({ name: 'Hacked Name' });

      expect(res.statusCode).toEqual(404);
    });
  });
});