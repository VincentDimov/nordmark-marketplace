import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';
import { auth } from './auth';
import { products, sellers } from './catalog';
export type Actor = {
  workspaceId: string;
  role: 'customer' | 'seller' | 'admin';
  sellerId: string;
  name: string;
  userId?: string;
};
const secret = () => new TextEncoder().encode(process.env.BETTER_AUTH_SECRET);
export async function setActor(actor: Actor) {
  const token = await new SignJWT(actor)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  (await cookies()).set('nordmark-demo', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 604800,
  });
}
export async function actor(create = true): Promise<Actor> {
  const cookie = (await cookies()).get('nordmark-demo')?.value;
  let a: Actor | undefined;
  if (cookie)
    try {
      const { payload } = await jwtVerify(cookie, secret());
      a = payload as unknown as Actor;
    } catch {}
  if (!a) {
    if (!create) throw Error('Starta din demomiljö först.');
    const ws = await db.workspace.create({ data: {} });
    a = { workspaceId: ws.id, role: 'customer', sellerId: 's1', name: 'Demokund' };
    await setActor(a);
    await seedWorkspace(ws.id);
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session && a.userId) {
    const ws = await db.workspace.create({ data: {} });
    await seedWorkspace(ws.id);
    a = { workspaceId: ws.id, role: 'customer', sellerId: 's1', name: 'Demokund' };
    await setActor(a);
  }
  if (session && a.userId !== session.user.id) {
    const [owned, current] = await Promise.all([
      db.workspace.findUnique({ where: { ownerId: session.user.id } }),
      db.workspace.findUnique({ where: { id: a.workspaceId } }),
    ]);
    if (owned && owned.id !== a.workspaceId) {
      if (!current?.ownerId) {
        const carts = await db.cart.findMany({
          where: { workspaceId: { in: [owned.id, a.workspaceId] } },
        });
        const combined = new Map<
          string,
          { offerId: string; quantity: number; selected: boolean }
        >();
        for (const c of carts)
          for (const l of c.items as { offerId: string; quantity: number; selected: boolean }[]) {
            const old = combined.get(l.offerId);
            combined.set(l.offerId, {
              ...l,
              quantity: Math.min(10, l.quantity + (old?.quantity || 0)),
            });
          }
        await db.cart.upsert({
          where: { workspaceId: owned.id },
          create: { workspaceId: owned.id, items: [...combined.values()] },
          update: { items: [...combined.values()] },
        });
        await db.cart.updateMany({ where: { workspaceId: a.workspaceId }, data: { items: [] } });
      }
      a.workspaceId = owned.id;
    } else if (!owned) {
      if (current?.ownerId && current.ownerId !== session.user.id) {
        const ws = await db.workspace.create({ data: { ownerId: session.user.id } });
        await seedWorkspace(ws.id);
        a.workspaceId = ws.id;
      } else
        await db.workspace.update({
          where: { id: a.workspaceId },
          data: { ownerId: session.user.id },
        });
    }
    a = { ...a, role: 'customer', name: session.user.name, userId: session.user.id };
    await setActor(a);
  }
  return a;
}
export async function seedWorkspace(id: string) {
  await db.$transaction([
    db.cart.create({ data: { workspaceId: id, items: [] } }),
    db.wishlist.create({ data: { workspaceId: id, name: 'Mina favoriter', items: [] } }),
    db.coupon.create({
      data: {
        workspaceId: id,
        code: 'HEJ10',
        percent: 10,
        limit: 5,
        expiresAt: new Date('2027-12-31'),
      },
    }),
    db.giftCard.create({ data: { workspaceId: id, code: 'NORD250', balance: 25000 } }),
    db.giftTransaction.create({ data: { workspaceId: id, code: 'NORD250', amount: 25000 } }),
    db.membership.create({
      data: { workspaceId: id, nextAt: new Date(Date.now() + 30 * 86400000) },
    }),
    db.notification.create({
      data: {
        workspaceId: id,
        title: 'Välkommen till Nordmark!',
        body: 'Din privata demomiljö är redo. Prova HEJ10 för 10 % rabatt och presentkort NORD250 (250 kr). Inga riktiga köp eller leveranser sker.',
      },
    }),
  ]);
  await db.address.create({
    data: {
      workspaceId: id,
      name: 'Alex Andersson (demo)',
      street: 'Demogatan 12',
      postalCode: '111 22',
      city: 'Stockholm',
    },
  });
  for (const [index, productIndex] of [1, 11, 21].entries()) {
    const p = products[productIndex],
      v = p.variants[0],
      o = v.offers[0],
      seller = sellers.find((s) => s.id === o.sellerId)!;
    const status = index === 0 ? 'DELIVERED' : index === 1 ? 'SHIPPED' : 'PROCESSING';
    const paid = index < 2;
    const order = await db.order.create({
      data: {
        workspaceId: id,
        idempotencyKey: `seed-${index}`,
        number: `NM-DEMO-${id.slice(-7).toUpperCase()}-${index + 1}`,
        orderStatus: paid ? 'PLACED' : 'PAYMENT_FAILED',
        paymentStatus: paid ? 'DEMO_PAID' : 'FAILED',
        fulfillmentStatus: status,
        returnStatus: index === 0 ? 'REQUESTED' : 'NONE',
        subtotal: o.price,
        shipping: 0,
        discount: 0,
        tax: Math.round(o.price * 0.2),
        total: o.price,
        address: {
          name: 'Alex Andersson',
          street: 'Demogatan 12',
          postalCode: '111 22',
          city: 'Stockholm',
          email: 'alex@example.com',
        },
        billingAddress: {
          name: 'Alex Andersson',
          street: 'Demogatan 12',
          postalCode: '111 22',
          city: 'Stockholm',
        },
        createdAt: new Date(Date.now() - (index + 2) * 86400000),
        items: {
          create: {
            offerId: o.id,
            productId: p.id,
            title: p.title,
            image: v.image,
            variant: v.name,
            sellerId: seller.id,
            sellerName: seller.name,
            quantity: 1,
            price: o.price,
            tax: Math.round(o.price * 0.2),
          },
        },
        shipments: {
          create: {
            sellerId: seller.id,
            status,
            tracking: paid ? `DEMO-${id.slice(-6)}-${index}` : null,
            events: [
              { label: 'Demoorder skapad', at: new Date(Date.now() - 3 * 86400000).toISOString() },
            ],
          },
        },
        payment: {
          create: { provider: 'demo', status: paid ? 'DEMO_PAID' : 'FAILED', amount: o.price },
        },
      },
    });
    if (paid)
      await db.inventory.create({ data: { workspaceId: id, offerId: o.id, stock: o.stock - 1 } });
    if (index === 0) {
      await db.returnRequest.create({
        data: {
          workspaceId: id,
          orderId: order.id,
          reason: 'Exempelretur: passade inte',
          amount: order.total,
        },
      });
      await db.review.create({
        data: {
          workspaceId: id,
          productId: p.id,
          rating: 4,
          title: 'En fin vardagsfavorit (demo)',
          body: 'Det här är en seedad demorecension kopplad till en genomförd demoorder.',
          author: 'Alex (demokund)',
          verified: true,
          demo: true,
        },
      });
    }
  }
  await db.supportTicket.create({
    data: {
      workspaceId: id,
      subject: 'Välkommen till din demo-kundservice',
      messages: [
        {
          author: 'Alex (demokund)',
          text: 'Hur fungerar leveransspårningen i demoläget?',
          at: new Date().toISOString(),
        },
        {
          author: 'Nordmark demo',
          text: 'Byt till säljarläget och markera en order som skickad. Därefter visas simulerad spårning i orderdetaljerna.',
          at: new Date().toISOString(),
        },
      ],
    },
  });
}
export function requireRole(a: Actor, ...roles: Actor['role'][]) {
  if (!roles.includes(a.role)) throw Error('Du saknar behörighet för den här åtgärden.');
}
