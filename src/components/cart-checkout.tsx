'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { ShoppingCart, ShieldCheck, Check, ArrowRight, LockKeyhole } from 'lucide-react';
import { findOffer, money, type CartLine } from '@/lib/catalog';
import { totals, shopRules } from '@/lib/totals';
import { useShop, type Order } from './shop-provider';
export function CartPage() {
  const { data, cart, run, loading, currency } = useShop();
  const [code, setCode] = useState('');
  if (loading) return <Loading />;
  const lines = data?.cart || [];
  const selected = lines.filter((l) => l.selected);
  const subtotal = selected.reduce((sum, l) => {
    const o = findOffer(l.offerId);
    return (
      sum +
      (data?.inventory.find((i) => i.offerId === l.offerId)?.price ?? o?.offer.price ?? 0) *
        l.quantity
    );
  }, 0);
  async function update(id: string, values: Partial<CartLine>) {
    await cart(lines.map((l) => (l.offerId === id ? { ...l, ...values } : l)));
  }
  return (
    <div className="content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DINA NÄSTA FAVORITER</p>
          <h1>Din varukorg</h1>
        </div>
        <span>{lines.length} produkter</span>
      </div>
      {lines.length ? (
        <div className="cart-layout">
          <section className="white-section cart-items">
            <div className="cart-topline">
              <button
                className="text-link"
                onClick={() =>
                  void cart(lines.map((l) => ({ ...l, selected: !lines.every((x) => x.selected) })))
                }
              >
                Välj / avmarkera alla
              </button>
              <span>Pris</span>
            </div>
            {lines.map((l) => {
              const m = findOffer(l.offerId)!;
              const inv = data?.inventory.find((i) => i.offerId === l.offerId);
              return (
                <article className="cart-row" key={l.offerId}>
                  <input
                    type="checkbox"
                    aria-label={`Välj ${m.product.title}`}
                    checked={l.selected}
                    onChange={(e) =>
                      void update(l.offerId, { selected: e.target.checked }).catch(() => {})
                    }
                  />
                  <Link href={`/produkt/${m.product.id}`}>
                    <img src={m.variant.image} alt={m.product.title} width={160} height={160} />
                  </Link>
                  <div className="cart-description">
                    <Link href={`/produkt/${m.product.id}`}>
                      <h2>{inv?.title || m.product.title}</h2>
                    </Link>
                    <p className="in-stock">
                      {(inv?.stock ?? m.offer.stock) > 0 ? 'I lager' : 'Tillfälligt slut'}
                    </p>
                    <small>
                      {m.variant.name} · Säljs av {m.seller.name}
                    </small>
                    <p className="delivery-text">Fri frakt från 499 kr</p>
                    <div className="cart-controls">
                      <label>
                        Antal
                        <select
                          value={l.quantity}
                          onChange={(e) =>
                            void update(l.offerId, { quantity: Number(e.target.value) }).catch(
                              () => {},
                            )
                          }
                        >
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() =>
                          void cart(lines.filter((x) => x.offerId !== l.offerId)).catch(() => {})
                        }
                      >
                        Ta bort
                      </button>
                      <button
                        onClick={async () => {
                          const list = data?.lists[0];
                          if (list) {
                            await run('list', {
                              id: list.id,
                              items: [...new Set([...list.items, m.product.id])],
                            });
                            await cart(lines.filter((x) => x.offerId !== l.offerId));
                          }
                        }}
                      >
                        Spara till senare
                      </button>
                    </div>
                  </div>
                  <strong>{money((inv?.price ?? m.offer.price) * l.quantity, currency)}</strong>
                </article>
              );
            })}
            <div className="cart-subtotal">
              Delsumma ({selected.reduce((sum, l) => sum + l.quantity, 0)} varor):{' '}
              <b>{money(subtotal, currency)}</b>
            </div>
          </section>
          <aside className="white-section cart-summary">
            <p className="free-shipping">
              <Check size={18} />
              {subtotal >= 49900
                ? 'Din beställning kvalificerar för fri standardfrakt.'
                : `${money(49900 - subtotal)} kvar till fri frakt.`}
            </p>
            <h2>Delsumma: {money(subtotal, currency)}</h2>
            <label>
              Rabattkod
              <input
                placeholder="HEJ10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </label>
            <Link
              className={`btn yellow ${!selected.length ? 'disabled' : ''}`}
              href={`/kassa${code ? '?coupon=' + encodeURIComponent(code) : ''}`}
            >
              Fortsätt till kassan <ArrowRight size={16} />
            </Link>
            <small>
              <ShieldCheck size={14} />
              Trygg simulerad betalning
            </small>
            <p className="muted">
              Slutliga priser, lager och rabatter kontrolleras på servern i kassan.
            </p>
          </aside>
        </div>
      ) : (
        <div className="empty white-section">
          <ShoppingCart size={64} />
          <h2>Din nästa favorit väntar</h2>
          <p>Varukorgen är tom. Dags för en liten upptäcktsfärd?</p>
          <Link className="btn yellow" href="/sok">
            Börja upptäcka
          </Link>
        </div>
      )}
    </div>
  );
}
export function CheckoutPage({ coupon: initialCoupon = '' }: { coupon?: string }) {
  const { data, run, loading } = useShop();
  const router = useRouter();
  const [coupon, setCoupon] = useState(initialCoupon);
  const [giftCode, setGiftCode] = useState('');
  const [express, setExpress] = useState(false);
  const [payment, setPayment] = useState('success');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [different, setDifferent] = useState(false);
  const key = useRef(crypto.randomUUID());
  if (loading) return <Loading />;
  const lines = data?.cart.filter((l) => l.selected) || [];
  const subtotal = lines.reduce(
    (s, l) =>
      s +
      (data?.inventory.find((i) => i.offerId === l.offerId)?.price ??
        findOffer(l.offerId)?.offer.price ??
        0) *
        l.quantity,
    0,
  );
  const summary = totals(
    subtotal,
    coupon === 'HEJ10' ? 10 : 0,
    data?.giftCards.find((g) => g.code === giftCode)?.balance || 0,
    express,
    data?.membership.active,
    shopRules(data?.settings),
  );
  if (!lines.length)
    return (
      <div className="content-page empty white-section">
        <h1>Välj dina favoriter först</h1>
        <p>Din varukorg har inga valda produkter.</p>
        <Link className="btn yellow" href="/varukorg">
          Till varukorgen
        </Link>
      </div>
    );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const address = {
      name: String(f.get('name')),
      street: String(f.get('street')),
      postalCode: String(f.get('postalCode')),
      city: String(f.get('city')),
      email: String(f.get('email')),
    };
    const billingAddress = different
      ? {
          name: String(f.get('billingName')),
          street: String(f.get('billingStreet')),
          postalCode: String(f.get('billingPostalCode')),
          city: String(f.get('billingCity')),
        }
      : undefined;
    try {
      const order = (await run('checkout', {
        idempotencyKey: key.current,
        address,
        billingAddress,
        coupon,
        giftCode,
        express,
        payment,
        giftMessage: String(f.get('giftMessage') || ''),
      })) as Order;
      key.current = crypto.randomUUID();
      if ((order as Order & { checkoutUrl?: string }).checkoutUrl) {
        window.location.assign((order as Order & { checkoutUrl: string }).checkoutUrl);
      } else router.push(`/bestallningar/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Köpet kunde inte genomföras.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="content-page checkout">
      <div className="checkout-heading">
        <h1>Kassa</h1>
        <span>
          <LockKeyhole size={18} />
          Säker demonstrationsbetalning
        </span>
      </div>
      <div className="notice">
        Det här är en demobutik. Ange inga riktiga kortuppgifter. Inga pengar debiteras och inga
        varor skickas.
      </div>
      <form onSubmit={submit} className="checkout-layout">
        <div>
          <section className="white-section">
            <h2>
              <i className="step-number">1</i> Dina uppgifter & leveransadress
            </h2>
            <p>
              Handla som gäst eller <Link href="/konto">logga in</Link>.
            </p>
            {data?.addresses.length ? (
              <label>
                Sparad adress
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const a = data.addresses.find((a) => a.id === e.target.value);
                    if (!a) return;
                    for (const k of ['name', 'street', 'postalCode', 'city'] as const) {
                      const input = document.querySelector<HTMLInputElement>(`[name="${k}"]`);
                      if (input) input.value = a[k];
                    }
                  }}
                >
                  <option value="">Välj adress</option>
                  {data.addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}, {a.street}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="form-grid">
              <label>
                Fullständigt namn
                <input
                  name="name"
                  required
                  minLength={2}
                  autoComplete="name"
                  defaultValue="Alex Andersson"
                />
              </label>
              <label>
                E-post
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue="alex@example.com"
                />
              </label>
              <label className="span-2">
                Gatuadress
                <input
                  name="street"
                  required
                  minLength={3}
                  autoComplete="street-address"
                  defaultValue="Demogatan 12"
                />
              </label>
              <label>
                Postnummer
                <input
                  name="postalCode"
                  required
                  pattern="[0-9]{3} ?[0-9]{2}"
                  defaultValue="111 22"
                  autoComplete="postal-code"
                />
              </label>
              <label>
                Ort
                <input
                  name="city"
                  required
                  minLength={2}
                  defaultValue="Stockholm"
                  autoComplete="address-level2"
                />
              </label>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={different}
                onChange={(e) => setDifferent(e.target.checked)}
              />
              Annan faktureringsadress
            </label>
            {different && (
              <div className="form-grid">
                {[
                  ['billingName', 'Namn'],
                  ['billingStreet', 'Gatuadress'],
                  ['billingPostalCode', 'Postnummer'],
                  ['billingCity', 'Ort'],
                ].map(([n, l]) => (
                  <label key={n}>
                    {l}
                    <input name={n} required minLength={2} />
                  </label>
                ))}
              </div>
            )}
          </section>
          <section className="white-section">
            <h2>
              <i className="step-number">2</i> Välj leverans
            </h2>
            <label className="radio-card">
              <input
                type="radio"
                name="shipping"
                checked={!express}
                onChange={() => setExpress(false)}
              />
              <span>
                <b>Standardleverans</b>
                <small>2–4 vardagar · simulerad</small>
              </span>
              <b>{subtotal >= 49900 || data?.membership.active ? 'Gratis' : '49 kr'}</b>
            </label>
            <label className="radio-card">
              <input
                type="radio"
                name="shipping"
                checked={express}
                onChange={() => setExpress(true)}
              />
              <span>
                <b>Expressleverans</b>
                <small>1–2 vardagar · simulerad</small>
              </span>
              <b>+39 kr</b>
            </label>
            <label>
              Presentmeddelande (valfritt)
              <textarea
                name="giftMessage"
                maxLength={300}
                placeholder="En hälsning till mottagaren"
              />
            </label>
          </section>
          <section className="white-section">
            <h2>
              <i className="step-number">3</i> Rabatt & presentkort
            </h2>
            <div className="form-grid">
              <label>
                Rabattkod
                <input
                  value={coupon}
                  placeholder="HEJ10"
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                />
              </label>
              <label>
                Presentkort
                <input
                  value={giftCode}
                  placeholder="NORD250"
                  onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                />
              </label>
            </div>
            <small>
              Demokoder: HEJ10 ger 10 % rabatt. NORD250 har 250 kr i startsaldo. Servern verifierar
              giltighet och aktuellt saldo.
            </small>
          </section>
          <section className="white-section">
            <h2>
              <i className="step-number">4</i> Testa betalning
            </h2>
            <div className="notice subtle">Demoadapter · inga kortuppgifter behövs</div>
            {[
              ...(data?.stripeEnabled
                ? [
                    [
                      'stripe',
                      'Stripe testbetalning',
                      'Fortsätt till Stripes säkra testkassa. Endast signerad webhook bekräftar ordern.',
                    ],
                  ]
                : []),
              ['success', 'Lyckad demobetalning', 'Ordern skapas och lagret uppdateras.'],
              ['fail', 'Misslyckad betalning', 'Prova avslag. Varukorgen och lagret bevaras.'],
              ['cancel', 'Avbruten betalning', 'Prova avbrott. Inga varor reserveras.'],
            ].map(([value, label, description]) => (
              <label className="radio-card" key={value}>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === value}
                  onChange={() => setPayment(value)}
                />
                <span>
                  <b>{label}</b>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </section>
        </div>
        <aside className="white-section order-summary">
          <h2>Din beställning</h2>
          {lines.map((l) => {
            const m = findOffer(l.offerId)!;
            return (
              <div className="mini-product" key={l.offerId}>
                <img src={m.variant.image} alt="" width={60} height={60} />
                <span>
                  {m.product.title}
                  <small>
                    {l.quantity} st · {m.variant.name}
                  </small>
                </span>
              </div>
            );
          })}
          <dl>
            <dt>Varor</dt>
            <dd>{money(summary.subtotal)}</dd>
            <dt>Frakt</dt>
            <dd>{money(summary.shipping)}</dd>
            <dt>Rabatt</dt>
            <dd>−{money(summary.discount)}</dd>
            <dt>Presentkort</dt>
            <dd>−{money(summary.giftAmount)}</dd>
          </dl>
          <div className="summary-total">
            <b>Totalt</b>
            <b>{money(summary.total)}</b>
          </div>
          <p className="muted">Varav moms: {money(summary.tax)}</p>
          <small>Förhandsberäkning. Slutlig summa beräknas av servern.</small>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <button disabled={busy} className="btn yellow">
            {busy ? 'Behandlar demoköp…' : 'Slutför demoköp'}
          </button>
          <p className="muted">
            Genom att fortsätta godkänner du <Link href="/villkor">demovillkoren</Link>.
          </p>
        </aside>
      </form>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span />
      Laddar din butik…
    </div>
  );
}
