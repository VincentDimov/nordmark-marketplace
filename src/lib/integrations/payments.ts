import Stripe from 'stripe';
import { db } from '../db';
import { transaction } from '../commerce';
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith('sk_test_')) throw Error('Endast Stripe testnycklar stöds.');
  return new Stripe(key);
}
export async function createTestPayment(orderId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { payment: true },
  });
  if (order.payment?.provider !== 'stripe' || order.paymentStatus !== 'PENDING')
    throw Error('Ordern väntar inte på Stripe testbetalning.');
  const stripe = stripeClient();
  if (order.payment.providerId) {
    const existing = await stripe.checkout.sessions.retrieve(order.payment.providerId);
    return existing.url;
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      customer_email: (order.address as { email: string }).email,
      line_items: [
        {
          price_data: {
            currency: 'sek',
            unit_amount: order.total,
            product_data: { name: `Nordmark testorder ${order.number}` },
          },
          quantity: 1,
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      success_url: `${base}/bestallningar/${order.id}`,
      cancel_url: `${base}/bestallningar/${order.id}`,
    },
    { idempotencyKey: `nordmark:${order.id}` },
  );
  await db.payment.update({ where: { orderId }, data: { providerId: session.id } });
  return session.url;
}
export async function processStripeEvent(event: Stripe.Event) {
  return transaction(async (tx) => {
    if (await tx.webhookEvent.findUnique({ where: { id: event.id } })) return { duplicate: true };
    if (['checkout.session.completed', 'checkout.session.expired'].includes(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      const order = await tx.order.findUnique({
        where: { id: session.client_reference_id || 'missing' },
        include: { payment: true, items: true },
      });
      if (
        order?.payment?.provider === 'stripe' &&
        order.payment.providerId === session.id &&
        order.paymentStatus === 'PENDING'
      ) {
        if (
          event.type === 'checkout.session.completed' &&
          session.payment_status === 'paid' &&
          session.currency === 'sek' &&
          session.amount_total === order.total &&
          !event.livemode
        ) {
          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'TEST_PAID', orderStatus: 'PLACED' },
          });
          await tx.payment.update({ where: { orderId: order.id }, data: { status: 'TEST_PAID' } });
          await tx.reservation.updateMany({
            where: { orderId: order.id, status: 'RESERVED' },
            data: { status: 'COMMITTED' },
          });
          await tx.notification.create({
            data: {
              workspaceId: order.workspaceId,
              title: `Testbetalning bekräftad ${order.number}`,
              body: 'Stripe har verifierat testbetalningen via signerad webhook. Inga riktiga pengar har debiterats.',
            },
          });
        }
        if (event.type === 'checkout.session.expired') {
          for (const item of order.items)
            await tx.inventory.update({
              where: {
                workspaceId_offerId: { workspaceId: order.workspaceId, offerId: item.offerId },
              },
              data: { stock: { increment: item.quantity } },
            });
          if (order.giftCode && order.giftAmount) {
            await tx.giftCard.update({
              where: { workspaceId_code: { workspaceId: order.workspaceId, code: order.giftCode } },
              data: { balance: { increment: order.giftAmount } },
            });
            await tx.giftTransaction.create({
              data: {
                workspaceId: order.workspaceId,
                code: order.giftCode,
                amount: order.giftAmount,
                orderId: order.id,
              },
            });
          }
          if (order.coupon)
            await tx.coupon.updateMany({
              where: { workspaceId: order.workspaceId, code: order.coupon, used: { gt: 0 } },
              data: { used: { decrement: 1 } },
            });
          await tx.order.update({
            where: { id: order.id },
            data: { orderStatus: 'CANCELLED', paymentStatus: 'EXPIRED' },
          });
          await tx.payment.update({ where: { orderId: order.id }, data: { status: 'EXPIRED' } });
          await tx.reservation.updateMany({
            where: { orderId: order.id, status: 'RESERVED' },
            data: { status: 'EXPIRED' },
          });
        }
      }
    }
    await tx.webhookEvent.create({ data: { id: event.id } });
    return { received: true };
  });
}
export async function refundTestPayment(sessionId: string, amount: number, idempotencyKey: string) {
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  if (session.livemode || !paymentIntent)
    throw Error('Stripe testbetalningen kan inte återbetalas.');
  return stripe.refunds.create({ payment_intent: paymentIntent, amount }, { idempotencyKey });
}
