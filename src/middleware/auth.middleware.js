const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');

/**
 * Protect routes - ensures user is authenticated via JWT
 */
const protect = catchAsync(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }
  
  // 1) Verify token
  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (error) {
    return next(new AppError('Invalid token or token has expired. Please log in again.', 401));
  }
  
  // 2) Check if user still exists
  const currentUser = await prisma.user.findUnique({
    where: { id: decoded.id }
  });
  
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }
  
  // Grant access to protected route
  req.user = currentUser;
  next();
});

module.exports = {
  protect
};
