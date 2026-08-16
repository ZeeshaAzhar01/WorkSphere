const prisma = require('../../src/config/database');

const clearDatabase = async () => {
  // Delete all data. Since we have onDelete: Cascade for most relations,
  // we just need to delete the top-level tables. 
  // For safety, we delete in reverse dependency order or just delete all.
  
  await prisma.webhookEvent.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  // Do not delete Plans as they are seeded and static.
};

module.exports = {
  clearDatabase
};
