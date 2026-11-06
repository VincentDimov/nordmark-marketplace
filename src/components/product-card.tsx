'use client';
import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import { type Product, money, discount } from '@/lib/catalog';
import { useShop } from './shop-provider';
export function ProductCard({
  product: p,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const { data, add, run, notify, currency } = useShop();
  const o = p.variants[0].offers[0];
  const inv = data?.inventory.find((i) => i.offerId === o.id);
  const price = inv?.price ?? o.price;
  const stock = inv?.stock ?? o.stock;
  const list = data?.lists[0];
  const favorite = list?.items.includes(p.id);
  return (
    <article className={`product-card ${compact ? 'compact' : ''}`}>
      <div className="product-image">
        <Link href={`/produkt/${p.id}`}>
          <img
            src={inv?.image || p.images[0]}
            alt={p.title}
            loading="lazy"
            width={300}
            height={250}
          />
        </Link>
        <button
          aria-label={favorite ? 'Ta bort favorit' : 'Spara favorit'}
          className={`favorite ${favorite ? 'active' : ''}`}
          onClick={() => {
            if (list)
              void run(
                'list',
                {
                  id: list.id,
                  items: favorite ? list.items.filter((id) => id !== p.id) : [...list.items, p.id],
                },
                favorite ? 'Borttagen från listan' : 'Sparad i Mina favoriter',
              ).catch(() => {});
            else notify('Butiken laddas. Försök igen strax.');
          }}
        >
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-card-body">
        <div className="deal-label">
          <span>−{discount(price, o.originalPrice)} %</span>
          <b>Veckans fynd</b>
        </div>
        <Link href={`/produkt/${p.id}`} className="product-title">
          {inv?.title || p.title}
        </Link>
        <div className="rating">
          <span>★★★★★</span>
          <small>
            {p.rating} <i>({p.reviewCount.toLocaleString('sv-SE')})</i>
          </small>
        </div>
        <div className="price-line">
          <strong>{money(price, currency)}</strong>
          <del>{money(o.originalPrice, currency)}</del>
        </div>
        <p className="delivery-text">
          {stock > 0 ? (
            <>
              <b className="prime-tick">✓</b> Fri frakt över 499 kr
            </>
          ) : (
            <span className="muted">Tillfälligt slut</span>
          )}
        </p>
        {!compact && (
          <>
            <small className="muted">
              {stock > 0 ? 'Leverans inom 2–4 vardagar' : 'Bevaka produkten för lagerbesked'}
            </small>
            <button
              disabled={!stock || !data}
              className="btn yellow add-small"
              onClick={() => void add(o.id).catch(() => {})}
            >
              <Plus size={15} /> Lägg i varukorg
            </button>
          </>
        )}
      </div>
    </article>
  );
}
export function ProductRail({
  title,
  subtitle,
  items,
  href = '/sok',
}: {
  title: string;
  subtitle?: string;
  items: Product[];
  href?: string;
}) {
  return (
    <section className="rail-section">
      <div className="section-heading">
        <div>
          {subtitle && <div className="eyebrow">{subtitle}</div>}
          <h2>{title}</h2>
        </div>
        <Link href={href}>
          Se alla <span>→</span>
        </Link>
      </div>
      <div className="product-rail">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} compact />
        ))}
      </div>
    </section>
  );
}
