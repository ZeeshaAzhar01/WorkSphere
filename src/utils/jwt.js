const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign a JWT token with the user's ID
 */
const signToken = (id) => {
  return jwt.sign({ id }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

/**
 * Verify a JWT token
 */
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, env.jwt.secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

module.exports = {
  signToken,
  verifyToken,
};
