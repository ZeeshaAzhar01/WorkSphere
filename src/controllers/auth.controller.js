const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res, next) => {
  const { user, token } = await authService.register(req.body);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res, next) => {
  const { user, token } = await authService.login(req.body);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

module.exports = {
  register,
  login,
};
