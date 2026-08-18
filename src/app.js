const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const authRoutes = require('./routes/auth.routes');
const organizationRoutes = require('./routes/organization.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const invitationRoutes = require('./routes/invitation.routes');
const membershipRoutes = require('./routes/membership.routes');

const app = express();

// --------------- Global Middleware ---------------

// Security headers
app.use(helmet());

// CORS — allow all origins in development
app.use(cors());

// Request logging
app.use(morgan('dev'));

// Body parsing — JSON for all routes
// Note: Stripe webhooks need raw body; we'll handle that in Phase 5
app.use(express.json());

// --------------- Routes ---------------

// Health check — verifies the server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/memberships', membershipRoutes);

// --------------- 404 Handler ---------------
// Catches any request that doesn't match a defined route
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404));
});

// --------------- Error Handler ---------------
app.use(errorHandler);

module.exports = app;
