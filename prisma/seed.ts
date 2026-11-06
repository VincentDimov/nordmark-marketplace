import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import catalog from '../src/lib/catalog.json';
const db = new PrismaClient();
async function main() {
  for (const c of catalog.categories)
    await db.category.upsert({ where: { id: c.id }, create: c, update: c });
  for (const s of catalog.sellers)
    await db.seller.upsert({ where: { id: s.id }, create: s, update: s });
  for (const p of catalog.products) {
    const { variants, source, ...data } = p;
    void source;
    await db.product.upsert({ where: { id: p.id }, create: data, update: data });
    for (const v of variants) {
      const { offers, ...variant } = v;
      await db.variant.upsert({
        where: { id: v.id },
        create: { ...variant, productId: p.id },
        update: variant,
      });
      for (const o of offers)
        await db.offer.upsert({
          where: { id: o.id },
          create: { ...o, variantId: v.id },
          update: o,
        });
    }
  }
  console.log('Seeded 120 products, 240 variants and offers, 12 categories, 5 sellers.');
}
main().finally(() => db.$disconnect());
