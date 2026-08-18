const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers/setup');

describe('Invitation Endpoints', () => {
  let ownerToken;
  let ownerId;
  let orgId;

  beforeEach(async () => {
    await clearDatabase();
    
    const ownerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Owner User',
        email: 'owner@example.com',
        password: 'password123'
      });
    ownerToken = ownerRes.body.token;
    ownerId = ownerRes.body.data.user.id;

    const orgRes = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', 'Bearer ' + ownerToken)
      .send({ name: 'Invite Org' });
    orgId = orgRes.body.data.organization.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/invitations', () => {
    it('should create a new invitation', async () => {
      const res = await request(app)
        .post('/api/v1/invitations')
        .set('Authorization', 'Bearer ' + ownerToken)
        .set('x-organization-id', orgId)
        .send({
          email: 'newuser@example.com',
          role: 'MEMBER'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.invitation.email).toEqual('newuser@example.com');
      expect(res.body.data.invitation.status).toEqual('PENDING');
      expect(res.body.data.invitation.token).toBeDefined();
    });
  });

  describe('POST /api/v1/invitations/:token/accept', () => {
    it('should accept an invitation and join organization', async () => {
      // 1. Create invite
      const inviteRes = await request(app)
        .post('/api/v1/invitations')
        .set('Authorization', 'Bearer ' + ownerToken)
        .set('x-organization-id', orgId)
        .send({ email: 'joiner@example.com' });
      
      const token = inviteRes.body.data.invitation.token;

      // 2. Register new user with that email
      const newRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Joiner User',
          email: 'joiner@example.com',
          password: 'password123'
        });
      const newToken = newRes.body.token;
      const newId = newRes.body.data.user.id;

      // 3. Accept invite
      const acceptRes = await request(app)
        .post(`/api/v1/invitations/${token}/accept`)
        .set('Authorization', 'Bearer ' + newToken); // no org header!

      expect(acceptRes.statusCode).toEqual(200);
      expect(acceptRes.body.data.membership.userId).toEqual(newId);
      expect(acceptRes.body.data.membership.organizationId).toEqual(orgId);

      // 4. Verify invite is ACCEPTED
      const dbInvite = await prisma.invitation.findUnique({ where: { token } });
      expect(dbInvite.status).toEqual('ACCEPTED');
    });
  });
});
