import { Prisma } from '@prisma/client';
import { db } from './db';
import { findOffer, type CartLine } from './catalog';
import type { Actor } from './session';
import { totals, shopRules } from './totals';
export async function transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let i = 0; i < 5; i++)
    try {
      return await db.$transaction(fn, { isolationLevel: 'Serializable', timeout: 20000 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034' && i < 4)
        continue;
      throw e;
    }
  throw Error('Försök igen.');
}
export type CheckoutInput = {
  idempotencyKey: string;
  address: { name: string; street: string; postalCode: string; city: string; email: string };
  billingAddress?: { name: string; street: string; postalCode: string; city: string };
  coupon?: string;
  giftCode?: string;
  giftMessage?: string;
  express?: boolean;
  payment: 'success' | 'fail' | 'cancel' | 'stripe';
};
export async function checkout(a: Actor, input: CheckoutInput) {
  return transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: a.workspaceId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: { items: true, shipments: true },
    });
    if (existing) return existing;
    const cart = await tx.cart.findUnique({ where: { workspaceId: a.workspaceId } });
    const lines = ((cart?.items as CartLine[]) || []).filter((l) => l.selected);
    if (!lines.length) throw Error('Välj minst en produkt i varukorgen.');
    const ws = await tx.workspace.findUniqueOrThrow({ where: { id: a.workspaceId } });
    const rules = shopRules(ws.settings as Record<string, unknown>);
    const snapshots = [];
    let subtotal = 0;
    for (const line of lines) {
      const match = findOffer(line.offerId);
      if (!match || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10)
        throw Error('Ogiltig varukorgsrad.');
      const { product, variant, offer, seller } = match;
      const inv = await tx.inventory.upsert({
        where: { workspaceId_offerId: { workspaceId: a.workspaceId, offerId: offer.id } },
        create: { workspaceId: a.workspaceId, offerId: offer.id, stock: offer.stock },
        update: {},
      });
      if (inv.stock < line.quantity)
        throw Error(`${product.title}: endast ${inv.stock} kvar i lager.`);
      const price = inv.price ?? offer.price;
      subtotal += price * line.quantity;
      snapshots.push({
        offerId: offer.id,
        productId: product.id,
        title: inv.title || product.title,
        image: inv.image || variant.image,
        variant: variant.name,
        sellerId: seller.id,
        sellerName: seller.name,
        quantity: line.quantity,
        price,
        tax: Math.round((price * line.quantity * rules.taxPercent) / (100 + rules.taxPercent)),
      });
    }
    const coupon = input.coupon
      ? await tx.coupon.findUnique({
          where: {
            workspaceId_code: { workspaceId: a.workspaceId, code: input.coupon.toUpperCase() },
          },
        })
      : null;
    if (input.coupon && (!coupon || coupon.expiresAt < new Date() || coupon.used >= coupon.limit))
      throw Error('Rabattkoden är ogiltig, förbrukad eller utgången.');
    const gift = input.giftCode
      ? await tx.giftCard.findUnique({
          where: {
            workspaceId_code: { workspaceId: a.workspaceId, code: input.giftCode.toUpperCase() },
          },
        })
      : null;
    if (input.giftCode && !gift) throw Error('Presentkortet finns inte.');
    const member = await tx.membership.findUnique({ where: { workspaceId: a.workspaceId } });
    const amounts = totals(
      subtotal,
      coupon?.percent || 0,
      gift?.balance || 0,
      input.express,
      member?.active,
      rules,
    );
    const success = input.payment === 'success';
    const pending = input.payment === 'stripe';
    const order = await tx.order.create({
      data: {
        workspaceId: a.workspaceId,
        idempotencyKey: input.idempotencyKey,
        number: `NM-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
        orderStatus: success
          ? 'PLACED'
          : pending
            ? 'AWAITING_PAYMENT'
            : input.payment === 'cancel'
              ? 'CANCELLED'
              : 'PAYMENT_FAILED',
        paymentStatus: success
          ? 'DEMO_PAID'
          : pending
            ? 'PENDING'
            : input.payment === 'cancel'
              ? 'CANCELLED'
              : 'FAILED',
        ...amounts,
        address: input.address,
        billingAddress: input.billingAddress || input.address,
        giftMessage: input.giftMessage,
        coupon: coupon?.code,
        giftCode: gift?.code,
        items: { create: snapshots },
        shipments: {
          create: [...new Set(snapshots.map((s) => s.sellerId))].map((sellerId) => ({
            sellerId,
            status: 'PROCESSING',
            events: [{ label: 'Order mottagen', at: new Date().toISOString() }],
          })),
        },
        payment: {
          create: {
            provider: pending ? 'stripe' : 'demo',
            status: success ? 'DEMO_PAID' : pending ? 'PENDING' : 'FAILED',
            amount: amounts.total,
          },
        },
      },
      include: { items: true, shipments: true },
    });
    if (success || pending) {
      for (const s of snapshots) {
        const changed = await tx.inventory.updateMany({
          where: { workspaceId: a.workspaceId, offerId: s.offerId, stock: { gte: s.quantity } },
          data: { stock: { decrement: s.quantity } },
        });
        if (changed.count !== 1) throw Error('Lagret har ändrats. Försök igen.');
        await tx.reservation.create({
          data: {
            workspaceId: a.workspaceId,
            orderId: order.id,
            offerId: s.offerId,
            quantity: s.quantity,
            expiresAt: new Date(Date.now() + 31 * 60000),
            status: pending ? 'RESERVED' : 'COMMITTED',
          },
        });
        await tx.inventoryEvent.create({
          data: {
            workspaceId: a.workspaceId,
            offerId: s.offerId,
            delta: -s.quantity,
            reason: order.number,
          },
        });
      }
      if (coupon) {
        const used = await tx.coupon.updateMany({
          where: { id: coupon.id, used: { lt: coupon.limit } },
          data: { used: { increment: 1 } },
        });
        if (used.count !== 1) throw Error('Rabattkoden är förbrukad.');
      }
      if (gift && amounts.giftAmount) {
        const used = await tx.giftCard.updateMany({
          where: { id: gift.id, balance: { gte: amounts.giftAmount } },
          data: { balance: { decrement: amounts.giftAmount } },
        });
        if (used.count !== 1) throw Error('Presentkortssaldot har ändrats.');
        await tx.giftTransaction.create({
          data: {
            workspaceId: a.workspaceId,
            code: gift.code,
            amount: -amounts.giftAmount,
            orderId: order.id,
          },
        });
      }
      await tx.cart.update({
        where: { workspaceId: a.workspaceId },
        data: { items: (cart!.items as CartLine[]).filter((l) => !l.selected) },
      });
      await tx.notification.create({
        data: {
          workspaceId: a.workspaceId,
          title: `Order ${order.number} ${pending ? 'väntar på betalning' : 'bekräftad'}`,
          body: pending
            ? 'Lager reserverat i 31 minuter. Endast verifierad Stripe-webhook godkänner betalningen.'
            : 'Din simulerade betalning är klar. Följ demoordern under Beställningar.',
        },
      });
    }
    return order;
  });
}
