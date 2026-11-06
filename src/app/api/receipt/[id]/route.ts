import { actor } from '@/lib/session';
import { db } from '@/lib/db';
import { money } from '@/lib/catalog';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await actor();
  const { id } = await params;
  const order = await db.order.findFirst({
    where: { id, workspaceId: a.workspaceId },
    include: { items: true },
  });
  if (!order) return new Response('Ordern finns inte.', { status: 404 });
  const receipt = [
    `NORDMARK • DEMOUNDERLAG (ej bokföringsunderlag)`,
    order.number,
    new Date(order.createdAt).toLocaleDateString('sv-SE'),
    '',
    ...order.items.map(
      (i) => `${i.quantity} × ${i.title} (${i.variant}): ${money(i.price * i.quantity)}`,
    ),
    '',
    `Frakt: ${money(order.shipping)}`,
    `Rabatt: ${money(order.discount)}`,
    `Presentkort: ${money(order.giftAmount)}`,
    `Moms ingår: ${money(order.tax)}`,
    `Totalt: ${money(order.total)}`,
    `Betalning: ${order.paymentStatus}`,
    'Ingen riktig betalning eller leverans sker.',
  ].join('\n');
  return new Response(receipt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${order.number}.txt"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
