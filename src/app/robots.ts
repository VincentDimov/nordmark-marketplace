import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/sok', '/produkt/', '/butik/'],
      disallow: [
        '/api/',
        '/konto',
        '/kassa',
        '/varukorg',
        '/bestallningar',
        '/portal',
        '/admin',
        '/onskelistor',
        '/lista/',
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}
