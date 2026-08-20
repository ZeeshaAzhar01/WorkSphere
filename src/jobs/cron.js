const cron = require('node-cron');
const prisma = require('../config/database');

// Run every hour at the top of the hour
const scheduleJobs = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running scheduled jobs...');
    await expireInvitations();
    await expireTrials();
    console.log('[Cron] Scheduled jobs completed.');
  });
};

const expireInvitations = async () => {
  try {
    const result = await prisma.invitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });
    if (result.count > 0) {
      console.log(`[Cron] Expired ${result.count} invitations.`);
    }
  } catch (error) {
    console.error('[Cron] Error expiring invitations:', error);
  }
};

const expireTrials = async () => {
  try {
    const result = await prisma.subscription.updateMany({
      where: {
        status: 'TRIALING',
        trialEnd: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });
    if (result.count > 0) {
      console.log(`[Cron] Expired ${result.count} trials.`);
    }
  } catch (error) {
    console.error('[Cron] Error expiring trials:', error);
  }
};

module.exports = {
  scheduleJobs,
  expireInvitations,
  expireTrials
};