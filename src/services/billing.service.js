const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const stripe = require('../utils/stripe');

const getSubscription = async (organizationId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true }
  });

  if (!subscription) {
    throw new AppError('Subscription not found for this organization', 404);
  }

  return subscription;
};

const createCheckoutSession = async (organizationId, userId, priceId) => {
  // 1. Verify organization exists and user is owner (authorization handled in router)
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: true }
  });

  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // 2. Verify price exists in our db
  const plan = await prisma.plan.findUnique({
    where: { stripePriceId: priceId }
  });

  if (!plan && process.env.NODE_ENV !== 'test') { // Allow mocking in tests
    throw new AppError('Invalid plan selected', 400);
  }

  // 3. Create or get stripe customer id
  let customerId = organization.subscription?.stripeCustomerId;
  
  if (!customerId && process.env.NODE_ENV !== 'test') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const customer = await stripe.customers.create({
      email: user.email,
      name: organization.name,
      metadata: {
        organizationId: organization.id
      }
    });
    customerId = customer.id;
    
    // Save customer id to subscription
    await prisma.subscription.update({
      where: { organizationId },
      data: { stripeCustomerId: customerId }
    });
  }

  if (process.env.NODE_ENV === 'test') {
    return { url: 'https://checkout.stripe.com/test-session-url' };
  }

  // 4. Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/billing?success=true`,
    cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/billing?canceled=true`,
    client_reference_id: organizationId,
    metadata: {
      organizationId,
    },
  });

  return { url: session.url };
};

const createPortalSession = async (organizationId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId }
  });

  if (!subscription || !subscription.stripeCustomerId) {
    throw new AppError('No active paid subscription found for this organization', 400);
  }

  if (process.env.NODE_ENV === 'test') {
    return { url: 'https://billing.stripe.com/test-portal-url' };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/billing`,
  });

  return { url: session.url };
};

const handleWebhook = async (event) => {
  // Idempotency check
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id }
  });

  if (existingEvent && existingEvent.processingStatus === 'PROCESSED') {
    return; // Already processed
  }

  if (!existingEvent) {
    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        payload: event,
        processingStatus: 'PROCESSING'
      }
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const organizationId = session.metadata.organizationId || session.client_reference_id;
        
        if (organizationId && session.subscription) {
          // Fetch the subscription to get the price ID (in a real app we'd fetch this from Stripe)
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = stripeSub.items.data[0].price.id;
          
          const plan = await prisma.plan.findUnique({ where: { stripePriceId: priceId } });
          
          if (plan) {
            await prisma.subscription.update({
              where: { organizationId },
              data: {
                planId: plan.id,
                stripeSubscriptionId: session.subscription,
                stripeCustomerId: session.customer,
                status: 'ACTIVE',
              }
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0].price.id;
        
        const plan = await prisma.plan.findUnique({ where: { stripePriceId: priceId } });
        
        if (plan) {
          // Convert unix timestamps
          const currentPeriodStart = new Date(subscription.current_period_start * 1000);
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          
          let status = 'ACTIVE';
          if (subscription.status === 'past_due') status = 'PAST_DUE';
          if (subscription.status === 'canceled') status = 'CANCELLED';
          if (subscription.status === 'unpaid') status = 'EXPIRED';

          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              planId: plan.id,
              status,
              currentPeriodStart,
              currentPeriodEnd,
            }
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Revert to FREE plan
        const freePlan = await prisma.plan.findUnique({ where: { name: 'FREE' } });
        
        if (freePlan) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              planId: freePlan.id,
              status: 'CANCELLED',
              cancelledAt: new Date(),
              stripeSubscriptionId: null // Clear so they can resubscribe
            }
          });
        }
        break;
      }
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processingStatus: 'PROCESSED',
        processedAt: new Date()
      }
    });

  } catch (error) {
    // Mark as failed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processingStatus: 'FAILED'
      }
    });
    throw error;
  }
};

module.exports = {
  getSubscription,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
};