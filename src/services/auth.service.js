const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

/**
 * Register a new user
 * @param {Object} data - { email, name, password }
 * @returns {Object} { user, token }
 */
const register = async (data) => {
  const { email, name, password } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
  });

  // Generate token
  const token = signToken(user.id);

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Login user
 * @param {Object} data - { email, password }
 * @returns {Object} { user, token }
 */
const login = async (data) => {
  const { email, password } = data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = signToken(user.id);

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token,
  };
};

module.exports = {
  register,
  login,
};
