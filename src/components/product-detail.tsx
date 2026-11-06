'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  MapPin,
  ZoomIn,
  X,
  Check,
  GitCompareArrows,
  Bell,
} from 'lucide-react';
import { products, categories, sellers, money, discount, type Product } from '@/lib/catalog';
import { useShop } from './shop-provider';
import { ProductRail } from './product-card';
export function ProductDetail({ product: p }: { product: Product }) {
  const { data, add, run, notify, currency } = useShop();
  const router = useRouter();
  const [variant, setVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [image, setImage] = useState(0);
  const [reviewSort, setReviewSort] = useState('new');
  const [reviewFilter, setReviewFilter] = useState('all');
  const v = p.variants[variant];
  const o = v.offers[0];
  const inv = data?.inventory.find((i) => i.offerId === o.id);
  const price = inv?.price ?? o.price;
  const stock = inv?.stock ?? o.stock;
  const seller = sellers.find((s) => s.id === o.sellerId)!;
  const category = categories.find((c) => c.id === p.categoryId)!;
  const reviews = (data?.reviews.filter((r) => r.productId === p.id) || [])
    .filter((r) => reviewFilter === 'all' || r.rating === Number(reviewFilter))
    .sort((a, b) =>
      reviewSort === 'rating'
        ? b.rating - a.rating
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const list = data?.lists[0];
  const favorite = list?.items.includes(p.id);
  useEffect(() => {
    try {
      const old = JSON.parse(localStorage.getItem('nordmark-recent') || '[]') as string[];
      localStorage.setItem(
        'nordmark-recent',
        JSON.stringify([p.id, ...old.filter((id) => id !== p.id)].slice(0, 12)),
      );
    } catch {}
  }, [p.id]);
  async function buy() {
    await add(o.id, quantity);
    router.push('/kassa');
  }
  function compare() {
    const ids = JSON.parse(localStorage.getItem('nordmark-compare') || '[]') as string[];
    if (!ids.includes(p.id))
      localStorage.setItem('nordmark-compare', JSON.stringify([...ids, p.id].slice(-4)));
    router.push('/jamfor');
  }
  return (
    <div className="product-page">
      <nav className="breadcrumbs">
        <Link href="/">Hem</Link> ›{' '}
        <Link href={`/sok?category=${category.id}`}>{category.name}</Link> › {p.brand}
      </nav>
      <div className="product-layout">
        <section className="gallery">
          <div className="thumbnails">
            {[...p.images, v.image].map((src, i) => (
              <button
                key={i}
                className={image === i ? 'selected' : ''}
                aria-label={`Visa bild ${i + 1}`}
                onClick={() => setImage(i)}
              >
                <img src={src} alt="" width={60} height={60} />
              </button>
            ))}
          </div>
          <button
            className="main-product-image"
            onClick={() => setZoom(true)}
            aria-label="Förstora produktbild"
          >
            <img
              src={inv?.image || p.images[image] || v.image}
              alt={`${p.title}, ${v.name}`}
              width={600}
              height={550}
            />
            <span>
              <ZoomIn size={18} />
              Klicka för att förstora
            </span>
          </button>
        </section>
        <section className="product-info">
          <Link className="text-link" href={`/sok?brand=${encodeURIComponent(p.brand)}`}>
            Besök {p.brand}-butiken
          </Link>
          <h1>{inv?.title || p.title}</h1>
          <p className="product-subtitle">{v.name} · Genomtänkt kvalitet för varje dag</p>
          <a href="#reviews" className="rating">
            <span>★★★★★</span>
            <small>
              {p.rating} · {p.reviewCount} demobetyg
            </small>
          </a>
          <span className="bestseller">
            Nordmarks val <b>i {category.name}</b>
          </span>
          <hr />
          <div className="deal-label">
            <span>Veckans erbjudande</span>
          </div>
          <div className="detail-price">
            <span>−{discount(price, o.originalPrice)} %</span>
            <strong>{money(price, currency)}</strong>
          </div>
          <p className="muted">
            Rekommenderat jämförelsepris: <del>{money(o.originalPrice, currency)}</del>
          </p>
          <small>
            Inklusive 25 % moms.{' '}
            {currency === 'EUR' ? 'EUR är en ungefärlig visningsvaluta. Checkout sker i SEK.' : ''}
          </small>
          <p className="coupon-note">
            Använd <b>HEJ10</b> för 10 % extra rabatt i demokassan.
          </p>
          <hr />
          <p>
            Utförande: <b>{v.name}</b>
          </p>
          <div className="variant-options">
            {p.variants.map((v, i) => (
              <button
                key={v.id}
                aria-pressed={variant === i}
                className={variant === i ? 'selected' : ''}
                onClick={() => {
                  setVariant(i);
                  setImage(0);
                }}
              >
                <b>{v.name}</b>
                <span>
                  {money(
                    data?.inventory.find((x) => x.offerId === v.offers[0].id)?.price ??
                      v.offers[0].price,
                    currency,
                  )}
                </span>
              </button>
            ))}
          </div>
          <h3>Om den här produkten</h3>
          <p>{p.description}</p>
          <ul className="feature-list">
            <li>Noga utvald av {seller.name}</li>
            <li>Två års garanti på tillämpliga produkter</li>
            <li>30 dagars öppet köp i demonstrationsflödet</li>
            <li>Två utföranden, med separat lager och pris</li>
          </ul>
          <div className="detail-actions">
            <button onClick={compare}>
              <GitCompareArrows size={16} />
              Jämför
            </button>
            <button
              onClick={() =>
                void navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => notify('Produktlänken är kopierad'))
              }
            >
              <Share2 size={16} />
              Dela
            </button>
            <button
              onClick={() =>
                void run(
                  'alert',
                  { productId: p.id, kind: stock ? 'PRICE' : 'STOCK' },
                  'Bevakning sparad i ditt konto',
                ).catch(() => {})
              }
            >
              <Bell size={16} />
              Bevaka {stock ? 'pris' : 'lager'}
            </button>
          </div>
        </section>
        <aside className="buy-box">
          <strong className="buy-price">{money(price, currency)}</strong>
          <p>
            <b>FRI leverans</b>{' '}
            {Number(String(data?.settings?.postcode || '11122').replace(/\s/g, '')) >= 80000
              ? 'inom 3–5 vardagar'
              : 'inom 2–4 vardagar'}{' '}
            vid köp över 499 kr.
          </p>
          <small className="muted">Simulerad leverans · inga varor skickas</small>
          <p className="location-line">
            <MapPin size={16} />
            Leverera till {String(data?.settings?.postcode || 'Stockholm 111 22')}
          </p>
          <h3 className={stock ? 'in-stock' : 'out-stock'}>
            {stock ? `I lager – ${stock} kvar` : 'Tillfälligt slut'}
          </h3>
          <label>
            Antal
            <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              {Array.from({ length: Math.min(stock || 1, 10) }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn yellow"
            disabled={!stock || !data}
            onClick={() => void add(o.id, quantity).catch(() => {})}
          >
            Lägg i varukorg
          </button>
          <button
            className="btn orange"
            disabled={!stock || !data}
            onClick={() => void buy().catch(() => {})}
          >
            Köp nu
          </button>
          <p className="secure">
            <ShieldCheck size={16} />
            Säker demotransaktion
          </p>
          <dl className="seller-meta">
            <dt>Skickas från</dt>
            <dd>Nordmark demo</dd>
            <dt>Säljs av</dt>
            <dd>
              <Link href={`/butik/${seller.id}`}>{seller.name}</Link>
            </dd>
            <dt>Returer</dt>
            <dd>30 dagars öppet köp</dd>
            <dt>Betalning</dt>
            <dd>Simulerad · 0 kr debiteras</dd>
          </dl>
          <hr />
          <button
            className="btn secondary"
            onClick={() =>
              list &&
              void run(
                'list',
                {
                  id: list.id,
                  items: favorite ? list.items.filter((id) => id !== p.id) : [...list.items, p.id],
                },
                favorite ? 'Borttagen från önskelistan' : 'Sparad i önskelistan',
              ).catch(() => {})
            }
          >
            <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
            {favorite ? 'Sparad i din lista' : 'Lägg i önskelista'}
          </button>
          <button
            className="text-link subscribe-link"
            onClick={() =>
              void run(
                'subscription',
                { productId: p.id },
                'Återkommande demoköp skapat. Hantera under ditt konto.',
              ).catch(() => {})
            }
          >
            Prenumerera var 30:e dag
          </button>
        </aside>
      </div>
      <div className="product-promises">
        <span>
          <Truck />
          Smidiga leveranser
        </span>
        <span>
          <RotateCcw />
          Enkla returer
        </span>
        <span>
          <ShieldCheck />
          Trygga demoköp
        </span>
      </div>
      <section className="white-section">
        <h2>Produktinformation</h2>
        <p>{p.description}</p>
        <table className="spec-table">
          <tbody>
            <tr>
              <th>Varumärke</th>
              <td>{p.brand}</td>
            </tr>
            <tr>
              <th>Kategori</th>
              <td>{category.name}</td>
            </tr>
            {Object.entries(p.attributes).map(([k, value]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{value}</td>
              </tr>
            ))}
            <tr>
              <th>Utförande</th>
              <td>{v.name}</td>
            </tr>
            <tr>
              <th>Säljare</th>
              <td>
                {seller.name} · {seller.rating}/5
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="white-section bundle">
        <div>
          <p className="eyebrow">PASSAR FINT IHOP</p>
          <h2>Ofta köpta tillsammans</h2>
          <p>Komplettera din favorit med något från samma kategori.</p>
          <Link
            href={`/produkt/${products.find((x) => x.categoryId === p.categoryId && x.id !== p.id)!.id}`}
          >
            Se den kompletterande produkten →
          </Link>
        </div>
        <img src={p.images[0]} alt="" width={140} height={140} />
        <span>+</span>
        <img
          src={products.find((x) => x.categoryId === p.categoryId && x.id !== p.id)!.images[0]}
          alt=""
          width={140}
          height={140}
        />
        <button
          className="btn yellow"
          onClick={async () => {
            const other = products.find((x) => x.categoryId === p.categoryId && x.id !== p.id)!;
            const items = [...(data?.cart || [])];
            for (const oid of [o.id, other.variants[0].offers[0].id]) {
              const old = items.find((l) => l.offerId === oid);
              if (old) old.quantity = Math.min(10, old.quantity + 1);
              else items.push({ offerId: oid, quantity: 1, selected: true });
            }
            await run('cart', { items }, 'Båda produkterna har lagts i varukorgen');
          }}
        >
          Lägg till båda
        </button>
      </section>
      <section id="reviews" className="white-section reviews-section">
        <div>
          <h2>Kundrecensioner</h2>
          <div className="rating large">
            <span>★★★★★</span> {p.rating} av 5
          </div>
          <p className="muted">Katalogbetyg och recensioner är demodata.</p>
          {[5, 4, 3, 2, 1].map((n) => (
            <button className="rating-bar" key={n} onClick={() => setReviewFilter(String(n))}>
              <span>{n} stjärnor</span>
              <i>
                <b style={{ width: `${n === 5 ? 72 : n === 4 ? 18 : n === 3 ? 6 : 2}%` }} />
              </i>
              <span>{n === 5 ? 72 : n === 4 ? 18 : n === 3 ? 6 : 2}%</span>
            </button>
          ))}
          <Link className="btn secondary" href={`/konto?review=${p.id}`}>
            Skriv en recension
          </Link>
        </div>
        <div>
          <div className="review-controls">
            <select
              aria-label="Sortera recensioner"
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value)}
            >
              <option value="new">Senaste först</option>
              <option value="rating">Högsta betyg</option>
            </select>
            <select
              aria-label="Filtrera recensioner"
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
            >
              <option value="all">Alla betyg</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stjärnor
                </option>
              ))}
            </select>
          </div>
          {reviews.length ? (
            reviews.map((r) => (
              <article className="review" key={r.id}>
                <b>{r.author}</b>
                <p className="stars">{'★'.repeat(r.rating)}</p>
                <h3>{r.title}</h3>
                <small>
                  {r.verified && (
                    <>
                      <Check size={12} />
                      Verifierat demoköp ·{' '}
                    </>
                  )}
                  Demorecension
                </small>
                <p>{r.body}</p>
              </article>
            ))
          ) : (
            <article className="review">
              <b>Nordmarks redaktion</b>
              <p className="stars">★★★★★</p>
              <h3>En favorit att upptäcka</h3>
              <small>Demorecension · inget verifierat köp</small>
              <p>
                Den här exempelrecensionen visar hur omdömen presenteras. Efter ett genomfört
                demoköp kan du lämna ditt eget omdöme.
              </p>
            </article>
          )}
        </div>
      </section>
      <section className="white-section">
        <h2>Frågor & svar</h2>
        {data?.questions
          .filter((q) => q.productId === p.id)
          .map((q) => (
            <div className="question" key={q.id}>
              <b>{q.question}</b>
              <p>{q.answer || 'Inväntar svar från säljaren.'}</p>
            </div>
          ))}
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.currentTarget;
            const question = String(new FormData(f).get('question'));
            await run(
              'question',
              { productId: p.id, question },
              'Din fråga har skickats till säljaren',
            );
            f.reset();
          }}
        >
          <input
            name="question"
            aria-label="Fråga om produkten"
            placeholder="Undrar du något om produkten?"
            minLength={5}
            required
          />
          <button className="btn secondary">Ställ en fråga</button>
        </form>
      </section>
      <ProductRail
        title="Du kanske också gillar"
        items={products.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 6)}
        href={`/sok?category=${p.categoryId}`}
      />
      <Dialog.Root open={zoom} onOpenChange={setZoom}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="modal zoom-modal">
            <Dialog.Title>{p.title}</Dialog.Title>
            <Dialog.Description>{v.name} – förstorad produktbild</Dialog.Description>
            <img src={p.images[image] || v.image} alt={p.title} />
            <Dialog.Close className="modal-close" aria-label="Stäng bild">
              <X />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
