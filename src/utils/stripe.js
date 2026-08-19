const Stripe = require('stripe');

// Initialize Stripe with the secret key from environment variables
// Use a fallback dummy key for local testing if not provided
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16', // Keep API version consistent
});

module.exports = stripe;