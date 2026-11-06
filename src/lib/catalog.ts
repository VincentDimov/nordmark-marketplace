import data from './catalog.json';
export const { products, categories, sellers } = data;
export type Product = (typeof products)[number];
export type CartLine = { offerId: string; quantity: number; selected: boolean };
export const money = (n: number, currency = 'SEK') =>
  new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'SEK' ? 0 : 2,
  }).format((n / 100) * (currency === 'EUR' ? 0.088 : 1));
export function findOffer(id: string) {
  for (const p of products)
    for (const v of p.variants)
      for (const o of v.offers)
        if (o.id === id)
          return {
            product: p,
            variant: v,
            offer: o,
            seller: sellers.find((s) => s.id === o.sellerId)!,
          };
  return null;
}
export function discount(price: number, original: number) {
  return Math.max(0, Math.round((1 - price / original) * 100));
}
export function searchProducts(
  params: Record<string, string | undefined>,
  items: Product[] = products,
) {
  const q = (params.q || '')
    .toLocaleLowerCase('sv')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  let result = items.filter((p) => {
    const text = [
      p.title,
      p.brand,
      p.description,
      categories.find((c) => c.id === p.categoryId)?.name,
      JSON.stringify(p.attributes),
    ]
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const o = p.variants[0].offers[0];
    return (
      q.split(/\s+/).every((w) => text.includes(w)) &&
      (!params.category || p.categoryId === params.category) &&
      (!params.brand || p.brand === params.brand) &&
      (!params.seller || o.sellerId === params.seller) &&
      (!params.rating || p.rating >= Number(params.rating)) &&
      (!params.max || o.price <= Number(params.max) * 100) &&
      (!params.min || o.price >= Number(params.min) * 100) &&
      (!params.stock || o.stock > 0) &&
      (!params.deals || discount(o.price, o.originalPrice) >= 20)
    );
  });
  if (params.sort === 'price-asc')
    result = result.sort((a, b) => a.variants[0].offers[0].price - b.variants[0].offers[0].price);
  if (params.sort === 'price-desc')
    result = result.sort((a, b) => b.variants[0].offers[0].price - a.variants[0].offers[0].price);
  if (params.sort === 'rating') result = result.sort((a, b) => b.rating - a.rating);
  if (params.sort === 'popular') result = result.sort((a, b) => b.reviewCount - a.reviewCount);
  if (params.sort === 'new') result = result.reverse();
  return result;
}
