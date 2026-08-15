const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

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

// API routes will be registered here in later phases
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/organizations', organizationRoutes);
// ...

// --------------- 404 Handler ---------------
// Catches any request that doesn't match a defined route
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404));
});

// --------------- Error Handler ---------------
app.use(errorHandler);

module.exports = app;
