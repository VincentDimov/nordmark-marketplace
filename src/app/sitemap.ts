import type { MetadataRoute } from 'next';
import { products, categories } from '@/lib/catalog';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return [
    { url: base },
    ...products.map((p) => ({ url: `${base}/produkt/${p.id}` })),
    ...categories.map((c) => ({ url: `${base}/sok?category=${c.id}` })),
  ];
}
