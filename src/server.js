const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/database');

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Connected to PostgreSQL database');

    // Start Express server
    const server = app.listen(env.port, () => {
      console.log(`\nWorkSphere API running on http://localhost:${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`Health check: http://localhost:${env.port}/health\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
