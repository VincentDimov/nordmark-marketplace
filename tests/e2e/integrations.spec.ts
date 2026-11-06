import 'dotenv/config';
import { test, expect } from '@playwright/test';
import Stripe from 'stripe';
import { db } from '../../src/lib/db';
const base = process.env.BASE_URL || 'http://localhost:3016';
test('signout isolates account data; login merges new guest cart exactly once', async ({
  request,
}) => {
  await request.get('/api/shop');
  const email = `merge-${crypto.randomUUID()}@example.com`;
  const password = 'TestPassword123!';
  await request.post('/api/shop', {
    data: { action: 'cart', items: [{ offerId: 'p001-v1-s1', quantity: 1, selected: true }] },
  });
  const signup = await request.post('/api/auth/sign-up/email', {
    headers: { Origin: base },
    data: { name: 'Merge Tester', email, password },
  });
  expect(signup.ok(), await signup.text()).toBeTruthy();
  const account = await (await request.get('/api/shop')).json();
  expect(account.actor.userId).toBeTruthy();
  await request.post('/api/auth/sign-out', { headers: { Origin: base }, data: {} });
  const guest = await (await request.get('/api/shop')).json();
  expect(guest.actor.workspaceId).not.toBe(account.actor.workspaceId);
  expect(guest.cart).toEqual([]);
  await request.post('/api/shop', {
    data: { action: 'cart', items: [{ offerId: 'p011-v1-s2', quantity: 2, selected: true }] },
  });
  const login = await request.post('/api/auth/sign-in/email', {
    headers: { Origin: base },
    data: { email, password },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  const merged = await (await request.get('/api/shop')).json();
  expect(merged.actor.workspaceId).toBe(account.actor.workspaceId);
  expect(merged.cart).toHaveLength(2);
  const again = await (await request.get('/api/shop')).json();
  expect(again.cart).toEqual(merged.cart);
});
test('Stripe signature, amount validation and repeated webhook are trusted and idempotent', async ({
  request,
}) => {
  test.skip(!process.env.STRIPE_WEBHOOK_SECRET, 'Local webhook secret required.');
  await request.get('/api/shop');
  await request.post('/api/shop', {
    data: { action: 'cart', items: [{ offerId: 'p001-v1-s1', quantity: 1, selected: true }] },
  });
  const response = await request.post('/api/shop', {
    data: {
      action: 'checkout',
      idempotencyKey: crypto.randomUUID(),
      address: {
        name: 'Webhook Test',
        street: 'Testgatan 1',
        postalCode: '111 22',
        city: 'Stockholm',
        email: 'webhook@example.com',
      },
      payment: 'success',
    },
  });
  expect(response.ok()).toBeTruthy();
  const order = await response.json();
  const sessionId = `cs_test_${crypto.randomUUID()}`;
  // Trusted fixture simulates a Stripe-created session without contacting a payment account.
  await db.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'PENDING', orderStatus: 'AWAITING_PAYMENT' },
  });
  await db.payment.update({
    where: { orderId: order.id },
    data: { provider: 'stripe', providerId: sessionId, status: 'PENDING' },
  });
  const stripe = new Stripe('sk_test_signature_testing');
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const eventId = `evt_test_${crypto.randomUUID()}`;
  function event(id: string, amount: number) {
    return JSON.stringify({
      id,
      object: 'event',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          client_reference_id: order.id,
          payment_status: 'paid',
          currency: 'sek',
          amount_total: amount,
        },
      },
    });
  }
  const bad = await request.post('/api/payments/webhook', {
    headers: { 'stripe-signature': 'bad', 'Content-Type': 'application/json' },
    data: event(eventId, order.total),
  });
  expect(bad.status()).toBe(400);
  const mismatch = event(`evt_wrong_${crypto.randomUUID()}`, order.total + 1);
  await request.post('/api/payments/webhook', {
    headers: {
      'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload: mismatch, secret }),
      'Content-Type': 'application/json',
    },
    data: mismatch,
  });
  expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe(
    'PENDING',
  );
  const payload = event(eventId, order.total);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  for (let i = 0; i < 2; i++) {
    const r = await request.post('/api/payments/webhook', {
      headers: { 'stripe-signature': signature, 'Content-Type': 'application/json' },
      data: payload,
    });
    expect(r.ok(), await r.text()).toBeTruthy();
  }
  expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe(
    'TEST_PAID',
  );
  expect(await db.webhookEvent.count({ where: { id: eventId } })).toBe(1);
});
test('wishlist sharing, membership, ticket, coupon expiry and upload validation', async ({
  request,
}) => {
  const d = await (await request.get('/api/shop')).json();
  const list = d.lists[0];
  const shared = await (
    await request.post('/api/shop', {
      data: { action: 'list', id: list.id, items: ['p001', 'p011'], shared: true },
    })
  ).json();
  expect((await request.get(`/lista/${shared.shareToken}`)).ok()).toBeTruthy();
  expect(
    (await request.post('/api/shop', { data: { action: 'membership', active: true } })).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.post('/api/shop', {
        data: {
          action: 'support',
          subject: 'Leveransfråga',
          message: 'Det här är en fråga från integrationstestet.',
        },
      })
    ).ok(),
  ).toBeTruthy();
  await request.post('/api/shop', { data: { action: 'role', role: 'admin' } });
  await request.post('/api/shop', {
    data: {
      action: 'coupon',
      code: 'OLD',
      percent: 10,
      limit: 1,
      expiresAt: '2020-01-01T00:00:00Z',
    },
  });
  await request.post('/api/shop', {
    data: { action: 'cart', items: [{ offerId: 'p001-v1-s1', quantity: 1, selected: true }] },
  });
  const expired = await request.post('/api/shop', {
    data: {
      action: 'checkout',
      idempotencyKey: crypto.randomUUID(),
      address: {
        name: 'Coupon Test',
        street: 'Testgatan 1',
        postalCode: '111 22',
        city: 'Stockholm',
        email: 'coupon@example.com',
      },
      payment: 'success',
      coupon: 'OLD',
    },
  });
  expect(expired.status()).toBe(400);
  const upload = await request.post('/api/upload', {
    multipart: {
      file: { name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') },
    },
  });
  expect(upload.status()).toBe(400);
});
test.afterAll(async () => {
  await db.$disconnect();
});
