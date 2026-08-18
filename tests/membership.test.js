const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers/setup');

describe('Membership Endpoints', () => {
  let ownerToken;
  let ownerId;
  let orgId;
  let memberId;

  beforeEach(async () => {
    await clearDatabase();
    
    const ownerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Owner',
        email: 'owner@example.com',
        password: 'password123'
      });
    ownerToken = ownerRes.body.token;
    ownerId = ownerRes.body.data.user.id;

    const orgRes = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', 'Bearer ' + ownerToken)
      .send({ name: 'Team Org' });
    orgId = orgRes.body.data.organization.id;

    const memberRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Member',
        email: 'member@example.com',
        password: 'password123'
      });
    memberId = memberRes.body.data.user.id;

    await prisma.membership.create({
      data: {
        userId: memberId,
        organizationId: orgId,
        role: 'MEMBER'
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/memberships', () => {
    it('should list all members of the organization', async () => {
      const res = await request(app)
        .get('/api/v1/memberships')
        .set('Authorization', 'Bearer ' + ownerToken)
        .set('x-organization-id', orgId);

      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toEqual(2); // Owner + Member
    });
  });

  describe('PATCH /api/v1/memberships/:userId', () => {
    it('should allow OWNER to promote a MEMBER to ADMIN', async () => {
      const res = await request(app)
        .patch(`/api/v1/memberships/${memberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-organization-id', orgId)
        .send({ role: 'ADMIN' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.membership.role).toEqual('ADMIN');
    });
  });

  describe('DELETE /api/v1/memberships/:userId', () => {
    it('should allow OWNER to remove a member', async () => {
      const res = await request(app)
        .delete(`/api/v1/memberships/${memberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-organization-id', orgId);

      expect(res.statusCode).toEqual(204);

      const remaining = await prisma.membership.count({ where: { organizationId: orgId } });
      expect(remaining).toEqual(1);
    });
  });
});
