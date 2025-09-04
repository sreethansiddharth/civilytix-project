import { Router } from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/auth.js';
import express from 'express';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const webhookRaw = express.raw({ type: 'application/json' });

export const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const paymentIntentId = pi.id;
      const order = await Order.findOne({ paymentIntentId });
      if (order) {
        order.status = 'succeeded';
        await order.save();

        const user = await User.findById(order.userId);
        if (user) {
          const plan = (pi.metadata && pi.metadata.plan) || 'lifetime';
          user.paymentStatus = plan === 'monthly' ? 'paid_monthly' : 'paid_lifetime';
          await user.save();
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const paymentIntentId = pi.id;
      await Order.findOneAndUpdate({ paymentIntentId }, { status: 'failed' });
    }
  } catch (err) {
    console.error('Webhook processing error:', err);

  }

  return res.status(200).json({ received: true });
};

router.post('/create-intent', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    let { amount, currency, plan } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid numeric amount (in cents) required' });
    }
    currency = (currency || process.env.DEFAULT_CURRENCY || 'usd').toLowerCase();
    plan = plan === 'monthly' ? 'monthly' : 'lifetime';
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let customerId = user.paymentGatewayCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { appUserId: String(user._id) }
      });
      customerId = customer.id;
      user.paymentGatewayCustomerId = customerId;
      await user.save();
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,               
      currency,
      customer: customerId,
      metadata: {
        appUserId: String(user._id),
        plan
      },
      automatic_payment_methods: { enabled: true }
    });
    const order = await Order.create({
      userId,
      amount,
      currency,
      status: 'pending',
      paymentIntentId: paymentIntent.id
    });
    return res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: String(order._id)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

export default router;
