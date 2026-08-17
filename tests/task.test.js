const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { clearDatabase } = require('./helpers/setup');

describe('Task Endpoints', () => {
  let userToken;
  let userId;
  let orgId;
  let projectId;

  beforeEach(async () => {
    await clearDatabase();
    
    // 1. Create a user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Task Tester',
        email: 'tasktester@example.com',
        password: 'password123'
      });
    userToken = userRes.body.token;
    userId = userRes.body.data.user.id;

    // 2. Create an organization
    const orgRes = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ` + userToken)
      .send({ name: 'Task Org' });
    orgId = orgRes.body.data.organization.id;

    // 3. Create a project
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ` + userToken)
      .set('x-organization-id', orgId)
      .send({ name: 'Initial Project' });
    projectId = projRes.body.data.project.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a task in the project', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ` + userToken)
        .set('x-organization-id', orgId)
        .send({
          title: 'First Task',
          projectId: projectId,
          status: 'TODO'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.task.title).toEqual('First Task');
      expect(res.body.data.task.projectId).toEqual(projectId);
    });

    it('should assign a task to a user', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ` + userToken)
        .set('x-organization-id', orgId)
        .send({
          title: 'Assigned Task',
          projectId: projectId,
          assigneeId: userId
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.task.assigneeId).toEqual(userId);
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('should get tasks for a project', async () => {
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ` + userToken)
        .set('x-organization-id', orgId)
        .send({ title: 'T1', projectId });

      const res = await request(app)
        .get('/api/v1/tasks?projectId=' + projectId)
        .set('Authorization', `Bearer ` + userToken)
        .set('x-organization-id', orgId);

      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toEqual(1);
    });
  });
});
