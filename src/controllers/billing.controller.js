const billingService = require('../services/billing.service');
const catchAsync = require('../utils/catchAsync');
const stripe = require('../utils/stripe');

const getSubscription = catchAsync(async (req, res, next) => {
  const subscription = await billingService.getSubscription(req.organizationId);

  res.status(200).json({
    status: 'success',
    data: { subscription },
  });
});

const createCheckoutSession = catchAsync(async (req, res, next) => {
  const { priceId } = req.body;
  
  if (!priceId) {
    return res.status(400).json({ status: 'fail', message: 'priceId is required' });
  }

  const session = await billingService.createCheckoutSession(
    req.organizationId,
    req.user.id,
    priceId
  );

  res.status(200).json({
    status: 'success',
    data: { url: session.url },
  });
});

const createPortalSession = catchAsync(async (req, res, next) => {
  const session = await billingService.createPortalSession(req.organizationId);

  res.status(200).json({
    status: 'success',
    data: { url: session.url },
  });
});

const handleWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // req.body here MUST be raw buffer (configured in app.js via express.raw)
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock'
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Pass the verified event to our service
  await billingService.handleWebhook(event);

  res.status(200).json({ received: true });
});

module.exports = {
  getSubscription,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
};