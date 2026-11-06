import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { products, sellers } from '@/lib/catalog';
import { db } from '@/lib/db';
import { SearchPage } from '@/components/search-page';
import { ProductDetail } from '@/components/product-detail';
import { CartPage, CheckoutPage, Loading } from '@/components/cart-checkout';
import { AccountPage, OrdersPage, WishlistsPage } from '@/components/account';
import { Portal } from '@/components/portal';
import {
  DemoPage,
  HelpPage,
  MembershipPage,
  GiftPage,
  SellerPage,
  ComparePage,
  ResetPage,
} from '@/components/extras';
import { ProductCard } from '@/components/product-card';
type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = slug[0] === 'produkt' ? products.find((p) => p.id === slug[1]) : null;
  const names: Record<string, string> = {
    sok: 'Hitta din nästa favorit',
    konto: 'Ditt konto',
    varukorg: 'Din varukorg',
    kassa: 'Kassa',
    bestallningar: 'Dina beställningar',
    onskelistor: 'Dina önskelistor',
    portal: 'Säljarportal',
    admin: 'Administration',
    demo: 'Utforska demoläget',
    hjalp: 'Vi hjälper dig',
    medlemskap: 'Nordmark Plus',
    presentkort: 'Presentkort',
    saljare: 'Sälj på Nordmark',
    jamfor: 'Jämför produkter',
  };
  return {
    title: p?.title || names[slug[0]] || 'Upptäck Nordmark',
    description: p?.description,
    robots: [
      'konto',
      'varukorg',
      'kassa',
      'bestallningar',
      'onskelistor',
      'portal',
      'admin',
      'demo',
      'lista',
      'aterstall',
    ].includes(slug[0])
      ? { index: false, follow: false }
      : undefined,
    alternates: { canonical: '/' + slug.join('/') },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const s = await searchParams;
  let content: React.ReactNode;
  switch (slug[0]) {
    case 'sok':
      content = <SearchPage params={s} />;
      break;
    case 'produkt': {
      const p = products.find((p) => p.id === slug[1]);
      if (!p) notFound();
      content = (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: p.title,
                description: p.description,
                image: p.images[0],
                brand: { '@type': 'Brand', name: p.brand },
                offers: {
                  '@type': 'Offer',
                  priceCurrency: 'SEK',
                  price: p.variants[0].offers[0].price / 100,
                  availability: p.variants[0].offers[0].stock
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                },
              }).replace(/</g, '\u003c'),
            }}
          />
          <ProductDetail product={p} />
        </>
      );
      break;
    }
    case 'varukorg':
      content = <CartPage />;
      break;
    case 'kassa':
      content = <CheckoutPage coupon={s.coupon} />;
      break;
    case 'konto':
      content = <AccountPage />;
      break;
    case 'bestallningar':
      content = <OrdersPage id={slug[1]} />;
      break;
    case 'onskelistor':
      content = <WishlistsPage />;
      break;
    case 'portal':
      content = <Portal />;
      break;
    case 'admin':
      content = <Portal admin />;
      break;
    case 'demo':
      content = <DemoPage />;
      break;
    case 'hjalp':
      content = <HelpPage />;
      break;
    case 'medlemskap':
      content = <MembershipPage />;
      break;
    case 'presentkort':
      content = <GiftPage />;
      break;
    case 'saljare':
      content = <SellerPage />;
      break;
    case 'jamfor':
      content = <ComparePage />;
      break;
    case 'aterstall':
      content = <ResetPage />;
      break;
    case 'butik': {
      const seller = sellers.find((s) => s.id === slug[1]);
      if (!seller) notFound();
      content = (
        <div className="content-page">
          <section className="seller-hero">
            <div>
              <p className="eyebrow">UTVALD SÄLJARE PÅ NORDMARK</p>
              <h1>{seller.name}</h1>
              <p>{seller.description}</p>
              <span>★ {seller.rating} / 5 · Demosäljare</span>
            </div>
          </section>
          <div className="results-grid">
            {products
              .filter((p) => p.variants.some((v) => v.offers.some((o) => o.sellerId === seller.id)))
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </div>
      );
      break;
    }
    case 'lista': {
      const list = await db.wishlist.findUnique({ where: { shareToken: slug[1] || 'missing' } });
      if (!list) notFound();
      content = (
        <div className="content-page">
          <h1>{list.name}</h1>
          <p>Delad önskelista. Endast produkterna visas, inga personuppgifter.</p>
          <div className="results-grid">
            {list.items
              .map((id) => products.find((p) => p.id === id)!)
              .filter(Boolean)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </div>
      );
      break;
    }
    case 'om':
    case 'hallbarhet':
    case 'villkor':
    case 'integritet': {
      const texts: Record<string, { title: string; paragraphs: string[] }> = {
        om: {
          title: 'Små upptäckter. Stora möjligheter.',
          paragraphs: [
            'Nordmark är en demonstrationsmarknadsplats inspirerad av stora nätbutikers informationsrika shoppingupplevelse. Här möts hem, teknik, mode och vardagens favoriter.',
            'Butiken har 120 exempelprodukter och fem demosäljare. Alla betalningar, leveranser och utbetalningar är simuleringar. Nordmark är inte knutet till Amazon.',
          ],
        },
        hallbarhet: {
          title: 'Ett mer medvetet val',
          paragraphs: [
            'Vi vill göra produktinformation tydlig och jämförelser enkla. I den här demonstrationsbutiken kan du utforska information, planera inköp och spara favoriter.',
            'Vi anger inga verifierade miljömärkningar eller hållbarhetslöften för exempelprodukterna. Produktuppgifterna är demodata och ska inte användas som verkliga köpbeslut.',
          ],
        },
        villkor: {
          title: 'Villkor för demonstrationsbutiken',
          paragraphs: [
            'Nordmark är en teknisk demonstration. Ingen bindande försäljning, faktisk betalning, fysisk leverans eller verklig återbetalning sker.',
            'Använd exempeluppgifter. Priser visas i SEK med 25 % moms i demoberäkningen. EUR är en ungefärlig visningsvaluta. Rabattkoder och presentkort saknar värde utanför demon.',
            'Demoorder kan avbeställas före leverans. Retur kan begäras efter skickad demoorder och hanteras av den isolerade demoadministratören.',
          ],
        },
        integritet: {
          title: 'Integritet i demoläget',
          paragraphs: [
            'Din demomiljö kopplas till en säker, HttpOnly-sessionscookie som gäller i sju dagar. Varukorgar, order, adresser och support lagras i PostgreSQL hos Neon i Frankfurt.',
            'Ett valfritt kundkonto använder Better Auth. Lösenord hanteras av autentiseringsbiblioteket. Ange inga betalningsuppgifter eller känsliga personuppgifter i demon.',
            'Ingen analys- eller marknadsföringsspårning används. Produktbilder lagras lokalt. Kontakta projektägaren för att begära borttagning av lagrade demouppgifter.',
          ],
        },
      };
      const t = texts[slug[0]];
      content = (
        <div className="content-page prose white-section">
          <p className="eyebrow">NORDMARK</p>
          <h1>{t.title}</h1>
          {t.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <Link href="/hjalp">Till hjälpcentret →</Link>
        </div>
      );
      break;
    }
    default:
      notFound();
  }
  return <Suspense fallback={<Loading />}>{content}</Suspense>;
}
