const express = require('express');
const billingController = require('../controllers/billing.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantContext } = require('../middleware/tenant.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');

const router = express.Router();

// The webhook needs the RAW body to verify Stripe signatures.
// It is mounted directly in app.js BEFORE express.json()

// All other billing routes require authentication and tenant context
router.use(protect);
router.use(tenantContext);
router.use(restrictTo('OWNER', 'ADMIN')); // Only owners/admins can view and change billing

router.get('/subscription', billingController.getSubscription);
router.post('/checkout', billingController.createCheckoutSession);
router.post('/portal', billingController.createPortalSession);

module.exports = router;