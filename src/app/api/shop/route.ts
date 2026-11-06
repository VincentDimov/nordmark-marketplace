import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { catalogForRequest } from '@/lib/server-catalog';
import { actor, setActor, requireRole } from '@/lib/session';
import { checkout, transaction } from '@/lib/commerce';
import { findOffer, products, searchProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
const addressSchema = z.object({
  name: z.string().min(2).max(100),
  street: z.string().min(3).max(150),
  postalCode: z.string().regex(/^\d{3}\s?\d{2}$/, 'Ange ett svenskt postnummer.'),
  city: z.string().min(2).max(80),
  email: z.email(),
});
const json = (value: unknown) =>
  NextResponse.json(value, { headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.has('search')) {
      const params = Object.fromEntries(req.nextUrl.searchParams);
      return json(
        searchProducts({ ...params, q: params.search }, await catalogForRequest())
          .slice(0, 7)
          .map((p) => ({ id: p.id, title: p.title, image: p.images[0] })),
      );
    }
    const a = await actor();
    const [
      cart,
      lists,
      orders,
      addresses,
      membership,
      subscriptions,
      alerts,
      notifications,
      support,
      giftCards,
      giftTransactions,
      coupons,
      applications,
      audit,
      inventory,
      settings,
      returns,
      reviews,
      questions,
    ] = await Promise.all([
      db.cart.findUnique({ where: { workspaceId: a.workspaceId } }),
      db.wishlist.findMany({ where: { workspaceId: a.workspaceId } }),
      db.order.findMany({
        where: { workspaceId: a.workspaceId },
        include: { items: true, shipments: true, payment: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.address.findMany({ where: { workspaceId: a.workspaceId } }),
      db.membership.findUnique({ where: { workspaceId: a.workspaceId } }),
      db.subscription.findMany({ where: { workspaceId: a.workspaceId } }),
      db.alert.findMany({ where: { workspaceId: a.workspaceId } }),
      db.notification.findMany({
        where: { workspaceId: a.workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.supportTicket.findMany({
        where: { workspaceId: a.workspaceId },
        orderBy: { createdAt: 'desc' },
      }),
      db.giftCard.findMany({ where: { workspaceId: a.workspaceId } }),
      db.giftTransaction.findMany({
        where: { workspaceId: a.workspaceId },
        orderBy: { createdAt: 'desc' },
      }),
      db.coupon.findMany({ where: { workspaceId: a.workspaceId } }),
      db.sellerApplication.findMany({ where: { workspaceId: a.workspaceId } }),
      a.role === 'admin'
        ? db.auditLog.findMany({
            where: { workspaceId: a.workspaceId },
            orderBy: { createdAt: 'desc' },
            take: 100,
          })
        : [],
      db.inventory.findMany({ where: { workspaceId: a.workspaceId } }),
      db.workspace.findUnique({ where: { id: a.workspaceId }, select: { settings: true } }),
      db.returnRequest.findMany({ where: { workspaceId: a.workspaceId } }),
      db.review.findMany({ where: { workspaceId: a.workspaceId }, orderBy: { createdAt: 'desc' } }),
      db.question.findMany({ where: { workspaceId: a.workspaceId } }),
    ]);
    const visibleOrders =
      a.role === 'seller'
        ? orders
            .filter((o) => o.items.some((i) => i.sellerId === a.sellerId))
            .map((o) => ({
              ...o,
              address: {
                name: (o.address as { name: string }).name,
                street: (o.address as { street: string }).street,
                city: (o.address as { city: string }).city,
                postalCode: (o.address as { postalCode: string }).postalCode,
              },
              billingAddress: null,
              payment: null,
              items: o.items.filter((i) => i.sellerId === a.sellerId),
              shipments: o.shipments.filter((s) => s.sellerId === a.sellerId),
            }))
        : orders;
    return json({
      actor: a,
      cart: cart?.items || [],
      lists,
      orders: visibleOrders,
      addresses,
      membership,
      subscriptions,
      alerts,
      notifications,
      support,
      giftCards,
      giftTransactions,
      coupons:
        a.role === 'admin'
          ? coupons
          : coupons.map((c) => ({ code: c.code, percent: c.percent, expiresAt: c.expiresAt })),
      applications,
      audit,
      inventory,
      settings: settings?.settings,
      returns,
      reviews,
      questions,
      demo: process.env.DEMO_MODE === 'true',
      stripeEnabled: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
    });
  } catch (e) {
    return failure(e);
  }
}
function failure(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError)
    return jsonError('Data kunde inte sparas. Försök igen.');
  const msg =
    e instanceof z.ZodError
      ? e.issues[0].message
      : e instanceof Error
        ? e.message
        : 'Något gick fel.';
  return jsonError(msg, msg.includes('behörighet') ? 403 : 400);
}
function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin && origin !== process.env.BETTER_AUTH_URL)
      return jsonError('Otillåtet ursprung.', 403);
    const a = await actor();
    const bucket = `${a.workspaceId}:${Math.floor(Date.now() / 60000)}`;
    const rate = await db.rateLimit.upsert({
      where: { key: bucket },
      create: { key: bucket, resetAt: new Date(Date.now() + 60000) },
      update: { count: { increment: 1 } },
    });
    if (rate.count > 100) return jsonError('För många anrop. Försök om en minut.', 429);
    if (Number(req.headers.get('content-length') || 0) > 100000)
      return jsonError('För stort anrop.', 413);
    const body = await req.json();
    const action = z.string().parse(body.action);
    const id = () => z.string().min(1).max(150).parse(body.id);
    const scope = { workspaceId: a.workspaceId };
    if (action === 'role') {
      if (process.env.DEMO_MODE !== 'true') return jsonError('Demoroller är avstängda.', 403);
      const role = z.enum(['customer', 'seller', 'admin']).parse(body.role);
      await setActor({
        ...a,
        role,
        sellerId: z.enum(['s1', 's2', 's3', 's4', 's5']).parse(body.sellerId || 's1'),
      });
      return json({ ok: true });
    }
    if (action === 'cart') {
      const lines = z
        .array(
          z.object({
            offerId: z.string(),
            quantity: z.number().int().min(1).max(10),
            selected: z.boolean(),
          }),
        )
        .max(50)
        .parse(body.items);
      const seen = new Set<string>();
      for (const l of lines) {
        if (!findOffer(l.offerId) || seen.has(l.offerId))
          throw Error('Ogiltig eller duplicerad produkt.');
        seen.add(l.offerId);
      }
      await db.cart.upsert({
        where: { workspaceId: a.workspaceId },
        create: { ...scope, items: lines },
        update: { items: lines },
      });
      return json({ ok: true });
    }
    if (action === 'checkout') {
      const input = z
        .object({
          idempotencyKey: z.string().min(8).max(100),
          address: addressSchema,
          billingAddress: addressSchema.omit({ email: true }).optional(),
          coupon: z.string().max(40).optional(),
          giftCode: z.string().max(40).optional(),
          giftMessage: z.string().max(300).optional(),
          express: z.boolean().optional(),
          payment: z.enum(['success', 'fail', 'cancel', 'stripe']),
        })
        .parse(body);
      if (input.payment === 'stripe' && !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'))
        throw Error('Stripe test är inte konfigurerat. Använd demobetalning.');
      const order = await checkout(a, input);
      if (input.payment === 'stripe') {
        const { createTestPayment } = await import('@/lib/integrations/payments');
        return json({ ...order, checkoutUrl: await createTestPayment(order.id) });
      }
      return json(order);
    }
    if (action === 'order') {
      const order = await db.order.findFirst({
        where: { id: id(), ...scope },
        include: { items: true, shipments: true, payment: true },
      });
      if (!order) throw Error('Ordern finns inte.');
      return json(order);
    }
    if (action === 'cancel' || action === 'return' || action === 'refund') {
      const orderId = id();
      return json(
        await transaction(async (tx) => {
          const o = await tx.order.findFirst({
            where: { id: orderId, ...scope },
            include: { items: true, payment: true },
          });
          if (!o) throw Error('Ordern finns inte.');
          if (action === 'cancel') {
            if (o.orderStatus !== 'PLACED' || o.fulfillmentStatus !== 'PROCESSING')
              throw Error('Ordern kan inte avbeställas i detta läge.');
            if (o.payment?.provider === 'stripe' && o.payment.providerId) {
              const { refundTestPayment } = await import('@/lib/integrations/payments');
              await refundTestPayment(o.payment.providerId, o.total, `cancel:${o.id}`);
            }
            for (const item of o.items)
              await tx.inventory.update({
                where: {
                  workspaceId_offerId: { workspaceId: a.workspaceId, offerId: item.offerId },
                },
                data: { stock: { increment: item.quantity } },
              });
            if (o.giftAmount && o.giftCode) {
              await tx.giftCard.update({
                where: { workspaceId_code: { workspaceId: a.workspaceId, code: o.giftCode } },
                data: { balance: { increment: o.giftAmount } },
              });
              await tx.giftTransaction.create({
                data: { ...scope, code: o.giftCode, amount: o.giftAmount, orderId: o.id },
              });
            }
            await tx.payment.update({
              where: { orderId: o.id },
              data: { status: 'DEMO_REFUNDED', refunded: o.total },
            });
            return tx.order.update({
              where: { id: o.id },
              data: { orderStatus: 'CANCELLED', paymentStatus: 'DEMO_REFUNDED' },
            });
          }
          if (action === 'return') {
            if (
              !['DEMO_PAID', 'TEST_PAID'].includes(o.paymentStatus) ||
              o.returnStatus !== 'NONE' ||
              !['SHIPPED', 'DELIVERED'].includes(o.fulfillmentStatus)
            )
              throw Error('Retur kan begäras efter att ordern har skickats.');
            const reason = z.string().min(3).max(400).parse(body.reason);
            await tx.returnRequest.create({
              data: { ...scope, orderId: o.id, reason, amount: o.total },
            });
            return tx.order.update({ where: { id: o.id }, data: { returnStatus: 'REQUESTED' } });
          }
          requireRole(a, 'admin');
          if (
            o.returnStatus !== 'REQUESTED' ||
            !['DEMO_PAID', 'TEST_PAID'].includes(o.paymentStatus)
          )
            throw Error('Ingen retur väntar på godkännande.');
          const amount = z
            .number()
            .int()
            .min(1)
            .max(o.total - (o.payment?.refunded || 0))
            .parse(body.amount);
          if (o.payment?.provider === 'stripe' && o.payment.providerId) {
            const { refundTestPayment } = await import('@/lib/integrations/payments');
            await refundTestPayment(
              o.payment.providerId,
              amount,
              `return:${o.id}:${o.payment.refunded}`,
            );
          }
          await tx.returnRequest.update({
            where: { orderId: o.id },
            data: { status: 'REFUNDED', amount },
          });
          await tx.payment.update({
            where: { orderId: o.id },
            data: {
              refunded: { increment: amount },
              status: amount === o.total ? 'DEMO_REFUNDED' : 'DEMO_PARTIAL_REFUND',
            },
          });
          await tx.auditLog.create({
            data: {
              ...scope,
              actor: a.role,
              action: `Återbetalning ${amount} öre`,
              resource: o.number,
            },
          });
          return tx.order.update({
            where: { id: o.id },
            data: {
              returnStatus: 'REFUNDED',
              paymentStatus: amount === o.total ? 'DEMO_REFUNDED' : 'DEMO_PARTIAL_REFUND',
            },
          });
        }),
      );
    }
    if (action === 'ship') {
      requireRole(a, 'seller', 'admin');
      const shipment = await db.shipment.findFirst({
        where: {
          id: id(),
          order: { workspaceId: a.workspaceId },
          ...(a.role === 'seller' ? { sellerId: a.sellerId } : {}),
        },
        include: { order: true },
      });
      if (!shipment) throw Error('Du saknar behörighet till försändelsen.');
      if (
        !['DEMO_PAID', 'TEST_PAID'].includes(shipment.order.paymentStatus) ||
        shipment.order.orderStatus !== 'PLACED'
      )
        throw Error('Endast betalda aktiva order kan skickas.');
      const status = z.enum(['SHIPPED', 'DELIVERED']).parse(body.status);
      if (
        (status === 'SHIPPED' && shipment.status !== 'PROCESSING') ||
        (status === 'DELIVERED' && shipment.status !== 'SHIPPED')
      )
        throw Error('Ogiltig statusövergång.');
      await db.shipment.update({
        where: { id: shipment.id },
        data: {
          status,
          tracking: `DEMO-${shipment.id.slice(-8).toUpperCase()}`,
          events: [
            ...(shipment.events as Prisma.JsonArray),
            {
              label: status === 'SHIPPED' ? 'Skickad (simulerad)' : 'Levererad (simulerad)',
              at: new Date().toISOString(),
            },
          ],
        },
      });
      const all = await db.shipment.findMany({ where: { orderId: shipment.orderId } });
      await db.order.update({
        where: { id: shipment.orderId },
        data: {
          fulfillmentStatus: all.every((s) => s.status === 'DELIVERED')
            ? 'DELIVERED'
            : all.some((s) => s.status !== 'PROCESSING')
              ? 'SHIPPED'
              : 'PROCESSING',
        },
      });
      return json({ ok: true });
    }
    if (action === 'inventory') {
      requireRole(a, 'seller', 'admin');
      const offer = findOffer(id());
      if (!offer || (a.role === 'seller' && offer.offer.sellerId !== a.sellerId))
        throw Error('Du saknar behörighet till erbjudandet.');
      const data = z
        .object({
          stock: z.number().int().min(0).max(10000),
          price: z.number().int().min(100).max(100000000),
          title: z.string().min(3).max(200),
          image: z
            .string()
            .max(600)
            .refine(
              (v) =>
                v.startsWith('/images/') ||
                v.startsWith('/api/images/') ||
                (v.startsWith('https://') &&
                  new URL(v).hostname.endsWith('.public.blob.vercel-storage.com')),
              'Använd en uppladdad produktbild.',
            )
            .optional(),
        })
        .parse(body);
      await db.$transaction([
        db.inventory.upsert({
          where: { workspaceId_offerId: { workspaceId: a.workspaceId, offerId: offer.offer.id } },
          create: { ...scope, offerId: offer.offer.id, ...data },
          update: data,
        }),
        db.auditLog.create({
          data: {
            ...scope,
            actor: a.role,
            action: 'Uppdaterade produkt, pris och lager',
            resource: offer.offer.id,
          },
        }),
      ]);
      return json({ ok: true });
    }
    if (action === 'list-create') {
      const name = z.string().min(1).max(60).parse(body.name);
      return json(await db.wishlist.create({ data: { ...scope, name, items: [] } }));
    }
    if (action === 'list') {
      const list = await db.wishlist.findFirst({ where: { ...scope, id: id() } });
      if (!list) throw Error('Listan finns inte.');
      const items = z
        .array(z.string().refine((v) => products.some((p) => p.id === v)))
        .max(120)
        .parse(body.items);
      return json(
        await db.wishlist.update({
          where: { id: list.id },
          data: {
            items,
            ...(typeof body.shared === 'boolean'
              ? { shareToken: body.shared ? list.shareToken || crypto.randomUUID() : null }
              : {}),
          },
        }),
      );
    }
    if (action === 'address') {
      const data = addressSchema.omit({ email: true }).parse(body);
      return json(await db.address.create({ data: { ...scope, ...data } }));
    }
    if (action === 'address-delete') {
      await db.address.deleteMany({ where: { ...scope, id: id() } });
      return json({ ok: true });
    }
    if (action === 'membership') {
      return json(
        await db.membership.update({
          where: { workspaceId: a.workspaceId },
          data: { active: z.boolean().parse(body.active) },
        }),
      );
    }
    if (action === 'subscription') {
      const productId = z
        .string()
        .refine((v) => products.some((p) => p.id === v))
        .parse(body.productId);
      return json(
        await db.subscription.create({
          data: { ...scope, productId, nextAt: new Date(Date.now() + 30 * 86400000) },
        }),
      );
    }
    if (action === 'subscription-update') {
      const status = z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).parse(body.status);
      await db.subscription.updateMany({ where: { ...scope, id: id() }, data: { status } });
      return json({ ok: true });
    }
    if (action === 'alert') {
      return json(
        await db.alert.create({
          data: {
            ...scope,
            productId: z
              .string()
              .refine((v) => products.some((p) => p.id === v))
              .parse(body.productId),
            kind: z.enum(['PRICE', 'STOCK']).parse(body.kind),
          },
        }),
      );
    }
    if (action === 'notification') {
      await db.notification.updateMany({ where: scope, data: { read: true } });
      return json({ ok: true });
    }
    if (action === 'review') {
      const productId = z.string().parse(body.productId);
      const purchased = await db.orderItem.findFirst({
        where: {
          productId,
          order: { ...scope, paymentStatus: { in: ['DEMO_PAID', 'TEST_PAID'] } },
        },
      });
      if (!purchased) throw Error('Du kan recensera en produkt efter ett genomfört demoköp.');
      return json(
        await db.review.create({
          data: {
            ...scope,
            productId,
            rating: z.number().int().min(1).max(5).parse(body.rating),
            title: z.string().min(3).max(120).parse(body.title),
            body: z.string().min(10).max(2000).parse(body.body),
            author: a.name,
            verified: true,
            demo: true,
          },
        }),
      );
    }
    if (action === 'review-delete') {
      requireRole(a, 'admin');
      await db.review.deleteMany({ where: { id: id(), ...scope } });
      return json({ ok: true });
    }
    if (action === 'question') {
      return json(
        await db.question.create({
          data: {
            ...scope,
            productId: z.string().parse(body.productId),
            question: z.string().min(5).max(500).parse(body.question),
          },
        }),
      );
    }
    if (action === 'answer') {
      requireRole(a, 'seller', 'admin');
      const q = await db.question.findFirst({ where: { id: id(), ...scope } });
      if (!q) throw Error('Frågan finns inte.');
      if (
        a.role === 'seller' &&
        !products
          .find((p) => p.id === q.productId)
          ?.variants.some((v) => v.offers.some((o) => o.sellerId === a.sellerId))
      )
        throw Error('Du saknar behörighet till produkten.');
      await db.question.update({
        where: { id: q.id },
        data: { answer: z.string().min(2).max(1000).parse(body.answer) },
      });
      return json({ ok: true });
    }
    if (action === 'support') {
      return json(
        await db.supportTicket.create({
          data: {
            ...scope,
            subject: z.string().min(3).max(150).parse(body.subject),
            orderId: body.orderId ? z.string().parse(body.orderId) : null,
            messages: [
              {
                author: a.name,
                text: z.string().min(5).max(3000).parse(body.message),
                at: new Date().toISOString(),
              },
            ],
          },
        }),
      );
    }
    if (action === 'support-reply') {
      const ticket = await db.supportTicket.findFirst({ where: { ...scope, id: id() } });
      if (!ticket) throw Error('Ärendet finns inte.');
      await db.supportTicket.update({
        where: { id: ticket.id },
        data: {
          messages: [
            ...(ticket.messages as Prisma.JsonArray),
            {
              author: a.role === 'admin' ? 'Nordmark kundservice' : a.name,
              text: z.string().min(2).max(2000).parse(body.message),
              at: new Date().toISOString(),
            },
          ],
          status: body.close ? 'CLOSED' : 'OPEN',
        },
      });
      return json({ ok: true });
    }
    if (action === 'seller-apply') {
      return json(
        await db.sellerApplication.create({
          data: {
            ...scope,
            company: z.string().min(2).max(100).parse(body.company),
            registration: z
              .string()
              .regex(/^\d{6}-?\d{4}$/)
              .parse(body.registration),
          },
        }),
      );
    }
    if (action === 'seller-approve') {
      requireRole(a, 'admin');
      await db.sellerApplication.updateMany({
        where: { ...scope, id: id(), status: 'PENDING' },
        data: { status: z.enum(['APPROVED', 'REJECTED']).parse(body.status) },
      });
      return json({ ok: true });
    }
    if (action === 'coupon') {
      requireRole(a, 'admin');
      const data = z
        .object({
          code: z.string().regex(/^[A-Z0-9]{3,20}$/),
          percent: z.number().int().min(1).max(80),
          limit: z.number().int().min(1).max(10000),
          expiresAt: z.iso.datetime(),
        })
        .parse(body);
      return json(
        await db.coupon.upsert({
          where: { workspaceId_code: { workspaceId: a.workspaceId, code: data.code } },
          create: { ...scope, ...data, expiresAt: new Date(data.expiresAt) },
          update: { ...data, expiresAt: new Date(data.expiresAt) },
        }),
      );
    }
    if (action === 'gift') {
      requireRole(a, 'admin');
      const code = z
        .string()
        .regex(/^[A-Z0-9]{3,20}$/)
        .parse(body.code);
      const amount = z.number().int().min(100).max(100000).parse(body.amount);
      await db.$transaction([
        db.giftCard.upsert({
          where: { workspaceId_code: { workspaceId: a.workspaceId, code } },
          create: { ...scope, code, balance: amount },
          update: { balance: { increment: amount } },
        }),
        db.giftTransaction.create({ data: { ...scope, code, amount } }),
      ]);
      return json({ ok: true });
    }
    if (action === 'settings') {
      const settings = z
        .record(z.string(), z.union([z.string().max(500), z.boolean(), z.number()]))
        .parse(body.settings);
      const customerKeys = ['name', 'postcode', 'emailNotifications'];
      const sellerKeys = [
        `company_${a.sellerId}`,
        `description_${a.sellerId}`,
        `dispatchDays_${a.sellerId}`,
      ];
      if (
        a.role !== 'admin' &&
        Object.keys(settings).some(
          (k) => !customerKeys.includes(k) && !(a.role === 'seller' && sellerKeys.includes(k)),
        )
      )
        throw Error('Du saknar behörighet till inställningen.');
      for (const key of ['freeShippingThreshold', 'standardShipping', 'expressShipping'])
        if (key in settings) z.number().int().min(0).max(10000000).parse(settings[key]);
      if ('taxPercent' in settings) z.number().min(0).max(50).parse(settings.taxPercent);
      const ws = await db.workspace.findUniqueOrThrow({ where: { id: a.workspaceId } });
      await db.workspace.update({
        where: { id: a.workspaceId },
        data: { settings: { ...(ws.settings as object), ...settings } },
      });
      return json({ ok: true });
    }
    throw Error('Okänd åtgärd.');
  } catch (e) {
    return failure(e);
  }
}
