import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from './db';
import { products } from './catalog';
export async function catalogForRequest() {
  const token = (await cookies()).get('nordmark-demo')?.value;
  if (!token) return products;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.BETTER_AUTH_SECRET),
    );
    if (typeof payload.workspaceId !== 'string') return products;
    const inventory = await db.inventory.findMany({ where: { workspaceId: payload.workspaceId } });
    if (!inventory.length) return products;
    const copy = structuredClone(products);
    for (const p of copy)
      for (const v of p.variants)
        for (const o of v.offers) {
          const i = inventory.find((i) => i.offerId === o.id);
          if (i) {
            o.stock = i.stock;
            o.price = i.price ?? o.price;
            if (i.title) p.title = i.title;
            if (i.image) {
              v.image = i.image;
              p.images[0] = i.image;
            }
          }
        }
    return copy;
  } catch {
    return products;
  }
}
