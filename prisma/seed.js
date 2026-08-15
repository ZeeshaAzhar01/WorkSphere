const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Seed the database with initial plan data.
 *
 * Plans are the foundation of the subscription system.
 * They define usage limits for each tier.
 *
 * priceMonthly is in cents:
 *   - FREE = 0
 *   - PRO = $29/month = 2900 cents
 *   - BUSINESS = $99/month = 9900 cents
 */
async function main() {
  console.log('Seeding plans...\n');

  const plans = [
    {
      name: 'FREE',
      maxMembers: 5,
      maxProjects: 3,
      maxTasks: 100,
      priceMonthly: 0,
      stripePriceId: null,
    },
    {
      name: 'PRO',
      maxMembers: 25,
      maxProjects: 25,
      maxTasks: 5000,
      priceMonthly: 2900,
      stripePriceId: null, // Will be set in Phase 5 with real Stripe Price IDs
    },
    {
      name: 'BUSINESS',
      maxMembers: 100,
      maxProjects: 100,
      maxTasks: 50000,
      priceMonthly: 9900,
      stripePriceId: null,
    },
  ];

  for (const plan of plans) {
    const result = await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        maxMembers: plan.maxMembers,
        maxProjects: plan.maxProjects,
        maxTasks: plan.maxTasks,
        priceMonthly: plan.priceMonthly,
      },
      create: plan,
    });
    console.log(`  ${result.name} plan: ${result.maxMembers} members, ${result.maxProjects} projects, ${result.maxTasks} tasks`);
  }

  console.log('\nSeeding complete.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
