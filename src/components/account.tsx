'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createAuthClient } from 'better-auth/react';
import {
  Package,
  MapPin,
  Heart,
  ShieldCheck,
  Bell,
  Repeat,
  User,
  Check,
  ArrowRight,
} from 'lucide-react';
import { products, money } from '@/lib/catalog';
import { useShop } from './shop-provider';
import { Loading } from './cart-checkout';
import { ProductCard } from './product-card';
const authClient = createAuthClient();
export function ActionForm({
  title,
  fields,
  onSubmit,
  button = 'Spara',
  children,
}: {
  title?: string;
  fields: {
    name: string;
    label: string;
    type?: string;
    value?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
  }[];
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
  button?: string;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className="action-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        const f = e.currentTarget;
        try {
          await onSubmit(Object.fromEntries(new FormData(f)) as Record<string, string>);
          f.reset();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Kunde inte spara.');
        } finally {
          setBusy(false);
        }
      }}
    >
      {title && <h3>{title}</h3>}
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.name}>
            {f.label}
            {f.options ? (
              <select name={f.name} defaultValue={f.value} required={f.required !== false}>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea
                name={f.name}
                defaultValue={f.value}
                required={f.required !== false}
                minLength={5}
              />
            ) : (
              <input
                name={f.name}
                type={f.type || 'text'}
                defaultValue={f.value}
                required={f.required !== false}
                minLength={f.type === 'password' ? 10 : undefined}
              />
            )}
          </label>
        ))}
      </div>
      {children}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="btn yellow" disabled={busy}>
        {busy ? 'Sparar…' : button}
      </button>
    </form>
  );
}
export function AccountPage() {
  const { data, run, refresh, loading, notify } = useShop();
  const [tab, setTab] = useState('overview');
  const [authMode, setAuthMode] = useState('signin');
  const { data: session } = authClient.useSession();
  const params = useSearchParams();
  if (loading) return <Loading />;
  const reviewProduct = params.get('review');
  const tabs = [
    ['overview', 'Översikt', User],
    ['addresses', 'Adresser', MapPin],
    ['subscriptions', 'Återkommande köp', Repeat],
    ['notifications', 'Notifikationer', Bell],
    ['settings', 'Inställningar', ShieldCheck],
  ] as const;
  return (
    <div className="content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DITT NORDMARK</p>
          <h1>Hej, {data?.actor.name || 'välkommen'}.</h1>
          <p>Allt som är ditt, samlat på ett ställe.</p>
        </div>
        <Link className="btn secondary" href="/demo">
          Byt demoroll
        </Link>
      </div>
      <div className="account-layout">
        <nav className="account-nav">
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
          <Link href="/bestallningar">
            <Package size={18} />
            Beställningar
          </Link>
          <Link href="/onskelistor">
            <Heart size={18} />
            Dina önskelistor
          </Link>
          <Link href="/presentkort">Presentkort & saldo</Link>
        </nav>
        <div>
          {tab === 'overview' && (
            <>
              <div className="account-tiles">
                <Link href="/bestallningar">
                  <Package />
                  <h3>Dina beställningar</h3>
                  <p>Följ, returnera eller köp igen.</p>
                  <b>{data?.orders.length} demoorder →</b>
                </Link>
                <Link href="/onskelistor">
                  <Heart />
                  <h3>Dina listor</h3>
                  <p>Favoriter till senare.</p>
                  <b>{data?.lists.length} listor →</b>
                </Link>
                <Link href="/medlemskap">
                  <ShieldCheck />
                  <h3>Nordmark Plus</h3>
                  <p>Lite extra, varje dag.</p>
                  <b>{data?.membership.active ? 'Aktivt demomedlemskap' : 'Utforska Plus'} →</b>
                </Link>
              </div>
              <section className="white-section auth-section">
                <h2>{session ? 'Ditt konto' : 'Logga in eller skapa konto'}</h2>
                {session ? (
                  <>
                    <p>
                      Inloggad som {session.user.email} ·{' '}
                      {session.user.emailVerified
                        ? 'E-post verifierad'
                        : 'E-post inte verifierad (demoläge)'}
                    </p>
                    <button
                      className="btn secondary"
                      onClick={async () => {
                        await authClient.signOut();
                        await refresh();
                        notify('Du är utloggad');
                      }}
                    >
                      Logga ut
                    </button>
                    <button
                      className="text-link"
                      onClick={async () => {
                        const r = await authClient.sendVerificationEmail({
                          email: session.user.email,
                          callbackURL: '/konto',
                        });
                        notify(r.error?.message || 'Verifieringslänk skapad i demo-e-postkön.');
                      }}
                    >
                      Skicka verifieringslänk
                    </button>
                  </>
                ) : (
                  <>
                    <div className="tabs">
                      <button
                        onClick={() => setAuthMode('signin')}
                        className={authMode === 'signin' ? 'active' : ''}
                      >
                        Logga in
                      </button>
                      <button
                        onClick={() => setAuthMode('signup')}
                        className={authMode === 'signup' ? 'active' : ''}
                      >
                        Skapa konto
                      </button>
                      <button
                        onClick={() => setAuthMode('reset')}
                        className={authMode === 'reset' ? 'active' : ''}
                      >
                        Glömt lösenord
                      </button>
                    </div>
                    <ActionForm
                      fields={[
                        ...(authMode === 'signup' ? [{ name: 'name', label: 'Namn' }] : []),
                        { name: 'email', label: 'E-post', type: 'email' },
                        ...(authMode !== 'reset'
                          ? [
                              {
                                name: 'password',
                                label: 'Lösenord (minst 10 tecken)',
                                type: 'password',
                              },
                            ]
                          : []),
                      ]}
                      button={
                        authMode === 'signup'
                          ? 'Skapa konto'
                          : authMode === 'reset'
                            ? 'Skapa återställningslänk'
                            : 'Logga in'
                      }
                      onSubmit={async (v) => {
                        const r =
                          authMode === 'signup'
                            ? await authClient.signUp.email({
                                name: v.name,
                                email: v.email,
                                password: v.password,
                              })
                            : authMode === 'reset'
                              ? await authClient.requestPasswordReset({
                                  email: v.email,
                                  redirectTo: '/aterstall',
                                })
                              : await authClient.signIn.email({
                                  email: v.email,
                                  password: v.password,
                                });
                        if (r.error) throw Error(r.error.message);
                        await refresh();
                        notify(
                          authMode === 'reset'
                            ? 'Om adressen finns har en länk skapats i demo-e-postkön.'
                            : 'Ditt konto är klart. Varukorgarna har slagits samman.',
                        );
                      }}
                    />
                    <p className="muted">
                      Du kan också fortsätta som demokund utan registrering. E-post skickas till
                      demokön; ingen extern e-posttjänst är ansluten.
                    </p>
                  </>
                )}
              </section>
              {reviewProduct && (
                <section className="white-section">
                  <h2>Recensera {products.find((p) => p.id === reviewProduct)?.title}</h2>
                  <ActionForm
                    fields={[
                      {
                        name: 'rating',
                        label: 'Betyg',
                        options: [5, 4, 3, 2, 1].map((n) => ({
                          value: String(n),
                          label: `${n} stjärnor`,
                        })),
                      },
                      { name: 'title', label: 'Rubrik' },
                      { name: 'body', label: 'Din recension', type: 'textarea' },
                    ]}
                    button="Publicera demorecension"
                    onSubmit={(v) =>
                      run(
                        'review',
                        { ...v, rating: Number(v.rating), productId: reviewProduct },
                        'Din demorecension är publicerad',
                      )
                    }
                  />
                </section>
              )}
            </>
          )}
          {tab === 'addresses' && (
            <section className="white-section">
              <h2>Din adressbok</h2>
              <div className="address-grid">
                {data?.addresses.map((a) => (
                  <article key={a.id}>
                    <b>{a.name}</b>
                    <p>
                      {a.street}
                      <br />
                      {a.postalCode} {a.city}
                    </p>
                    <button
                      className="text-link"
                      onClick={() =>
                        void run('address-delete', { id: a.id }, 'Adressen är borttagen').catch(
                          () => {},
                        )
                      }
                    >
                      Ta bort
                    </button>
                  </article>
                ))}
              </div>
              <ActionForm
                title="Lägg till adress"
                fields={[
                  { name: 'name', label: 'Namn' },
                  { name: 'street', label: 'Gatuadress' },
                  { name: 'postalCode', label: 'Postnummer' },
                  { name: 'city', label: 'Ort' },
                ]}
                onSubmit={(v) => run('address', v, 'Adressen är sparad')}
              />
            </section>
          )}
          {tab === 'subscriptions' && (
            <section className="white-section">
              <h2>Återkommande köp</h2>
              <p>
                På produktsidor kan du skapa ett simulerat återkommande köp var 30:e dag. Ingen
                automatisk betalning sker.
              </p>
              {data?.subscriptions.length ? (
                data.subscriptions.map((s) => (
                  <article className="subscription-row" key={s.id}>
                    <div>
                      <b>{products.find((p) => p.id === s.productId)?.title}</b>
                      <p>
                        Nästa tillfälle: {new Date(s.nextAt).toLocaleDateString('sv-SE')} · var{' '}
                        {s.interval}:e dag
                      </p>
                      <small>
                        {s.status === 'ACTIVE'
                          ? 'Aktiv'
                          : s.status === 'PAUSED'
                            ? 'Pausad'
                            : 'Avslutad'}
                      </small>
                    </div>
                    {s.status !== 'CANCELLED' && (
                      <>
                        <button
                          className="btn secondary"
                          onClick={() =>
                            void run(
                              'subscription-update',
                              { id: s.id, status: s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' },
                              'Prenumerationen är uppdaterad',
                            ).catch(() => {})
                          }
                        >
                          {s.status === 'ACTIVE' ? 'Pausa' : 'Återuppta'}
                        </button>
                        <button
                          className="text-link"
                          onClick={() =>
                            void run(
                              'subscription-update',
                              { id: s.id, status: 'CANCELLED' },
                              'Prenumerationen är avslutad',
                            ).catch(() => {})
                          }
                        >
                          Avsluta
                        </button>
                      </>
                    )}
                  </article>
                ))
              ) : (
                <p className="empty-small">Du har inga återkommande köp ännu.</p>
              )}
              <h3>Pris- & lagerbevakningar</h3>
              {data?.alerts.map((a) => (
                <p key={a.id}>
                  {products.find((p) => p.id === a.productId)?.title} ·{' '}
                  {a.kind === 'PRICE' ? 'Prisbevakning' : 'Lagerbevakning'}
                </p>
              ))}
            </section>
          )}
          {tab === 'notifications' && (
            <section className="white-section">
              <div className="section-heading">
                <h2>Dina notifikationer</h2>
                <button
                  className="text-link"
                  onClick={() =>
                    void run('notification', {}, 'Alla är markerade som lästa').catch(() => {})
                  }
                >
                  Markera alla som lästa
                </button>
              </div>
              {data?.notifications.map((n) => (
                <article className={`notification ${n.read ? 'read' : ''}`} key={n.id}>
                  <Bell size={20} />
                  <div>
                    <h3>{n.title}</h3>
                    <p>{n.body}</p>
                    <small>{new Date(n.createdAt).toLocaleString('sv-SE')}</small>
                  </div>
                </article>
              ))}
            </section>
          )}
          {tab === 'settings' && (
            <section className="white-section">
              <h2>Profil & inställningar</h2>
              <ActionForm
                fields={[
                  {
                    name: 'name',
                    label: 'Visningsnamn',
                    value: String(data?.settings.name || data?.actor.name || ''),
                  },
                  {
                    name: 'emailNotifications',
                    label: 'E-postnotifikationer',
                    options: [
                      { value: 'true', label: 'Ja, skicka till demo-e-postkön' },
                      { value: 'false', label: 'Nej tack' },
                    ],
                  },
                ]}
                onSubmit={async (v) => {
                  if (session) {
                    const result = await authClient.updateUser({ name: v.name });
                    if (result.error) throw Error(result.error.message);
                  }
                  return run(
                    'settings',
                    {
                      settings: {
                        name: v.name,
                        emailNotifications: v.emailNotifications === 'true',
                      },
                    },
                    'Dina inställningar är sparade',
                  );
                }}
              />
              <p>Den här butiken är en isolerad demonstration. Använd exempeluppgifter.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
const statusLabel: Record<string, string> = {
  PLACED: 'Mottagen',
  CANCELLED: 'Avbeställd',
  PAYMENT_FAILED: 'Betalning misslyckades',
  PROCESSING: 'Behandlas',
  SHIPPED: 'Skickad',
  DELIVERED: 'Levererad',
  AWAITING_PAYMENT: 'Inväntar betalning',
  PENDING: 'Inväntar betalningsbekräftelse',
  EXPIRED: 'Betalningstiden har gått ut',
  TEST_PAID: 'Stripe testbetalning godkänd',
  TEST_REFUNDED: 'Stripe teståterbetalad',
  DEMO_PAID: 'Demobetalning godkänd',
  DEMO_REFUNDED: 'Demoåterbetalad',
  FAILED: 'Misslyckad',
  REQUESTED: 'Retur begärd',
  REFUNDED: 'Återbetalad',
  NONE: 'Ingen retur',
  DEMO_PARTIAL_REFUND: 'Delvis demoåterbetalad',
};
export const labelStatus = (s: string) => statusLabel[s] || s;
export function OrdersPage({ id }: { id?: string }) {
  const { data, run, loading } = useShop();
  const [reason, setReason] = useState('Passade inte');
  const [confirm, setConfirm] = useState('');
  if (loading) return <Loading />;
  const order = id ? data?.orders.find((o) => o.id === id) : null;
  const rows = order ? [order] : data?.orders || [];
  return (
    <div className="content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DITT NORDMARK</p>
          <h1>{id ? 'Din beställning' : 'Dina beställningar'}</h1>
        </div>
        {id && <Link href="/bestallningar">Alla beställningar →</Link>}
      </div>
      {id && !order ? (
        <div className="empty white-section">
          <h2>Ordern kunde inte hittas</h2>
          <p>Den kan tillhöra en annan demomiljö eller ett annat konto.</p>
        </div>
      ) : rows.length ? (
        rows.map((o) => (
          <article className="order-card" key={o.id}>
            <div className="order-card-header">
              <div>
                <small>BESTÄLLNING LAGD</small>
                <b>{new Date(o.createdAt).toLocaleDateString('sv-SE')}</b>
              </div>
              <div>
                <small>TOTALT</small>
                <b>{money(o.total)}</b>
              </div>
              <div>
                <small>ORDERNUMMER</small>
                <b>{o.number}</b>
              </div>
              <Link href={`/bestallningar/${o.id}`}>Visa orderdetaljer →</Link>
            </div>
            <div className="order-body">
              <div className="order-status">
                <span className={`status status-${o.orderStatus.toLowerCase()}`}>
                  {labelStatus(o.orderStatus)}
                </span>
                <span>{labelStatus(o.paymentStatus)}</span>
                <span>{labelStatus(o.fulfillmentStatus)}</span>
              </div>
              {o.items.map((i) => (
                <div key={i.id} className="order-product">
                  <img src={i.image} alt="" width={100} height={100} />
                  <div>
                    <Link href={`/produkt/${i.productId}`}>
                      <h3>{i.title}</h3>
                    </Link>
                    <p>
                      {i.variant} · {i.quantity} st · {money(i.price * i.quantity)}
                    </p>
                    <small>Säljs av {i.sellerName}</small>
                    <div className="detail-actions">
                      <Link href={`/produkt/${i.productId}`}>Köp igen</Link>
                      {['DEMO_PAID', 'TEST_PAID'].includes(o.paymentStatus) && (
                        <Link href={`/konto?review=${i.productId}`}>Skriv recension</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {id && (
                <>
                  <hr />
                  <div className="order-detail-grid">
                    <div>
                      <h3>Leveransadress</h3>
                      {Object.entries(o.address as Record<string, string>)
                        .filter(([k]) => k !== 'email')
                        .map(([k, v]) => (
                          <p key={k}>{v}</p>
                        ))}
                    </div>
                    <div>
                      <h3>Betalningsöversikt</h3>
                      <p>Varor: {money(o.subtotal)}</p>
                      <p>Frakt: {money(o.shipping)}</p>
                      <p>Rabatt: −{money(o.discount)}</p>
                      <p>Presentkort: −{money(o.giftAmount)}</p>
                      <p>Inkluderad moms: {money(o.tax)}</p>
                      <b>Totalt: {money(o.total)}</b>
                      <p>Återbetalat: {money(o.payment?.refunded || 0)}</p>
                    </div>
                  </div>
                  <h3>Dina försändelser</h3>
                  {o.shipments.map((s) => (
                    <div className="shipment" key={s.id}>
                      <b>
                        {s.sellerId} · {labelStatus(s.status)}
                      </b>
                      <p>
                        {s.tracking || 'Spårningsnummer skapas när säljaren skickar demoordern.'}
                      </p>
                      {(s.events as { label: string; at: string }[]).map((ev, i) => (
                        <p key={i}>
                          <Check size={13} />
                          {ev.label} · {new Date(ev.at).toLocaleString('sv-SE')}
                        </p>
                      ))}
                    </div>
                  ))}
                  {o.giftMessage && <p>Presentmeddelande: {o.giftMessage}</p>}
                </>
              )}
              <div className="order-actions">
                <a className="btn secondary" href={`/api/receipt/${o.id}`}>
                  Hämta orderunderlag
                </a>
                {o.orderStatus === 'PLACED' &&
                  o.fulfillmentStatus === 'PROCESSING' &&
                  (confirm === o.id ? (
                    <>
                      <span>Avbeställa och återbetala demoköpet?</span>
                      <button
                        className="btn orange"
                        onClick={() =>
                          void run(
                            'cancel',
                            { id: o.id },
                            'Ordern är avbeställd och demobeloppet återbetalat',
                          )
                            .then(() => setConfirm(''))
                            .catch(() => {})
                        }
                      >
                        Ja, avbeställ
                      </button>
                      <button onClick={() => setConfirm('')}>Behåll order</button>
                    </>
                  ) : (
                    <button className="btn secondary" onClick={() => setConfirm(o.id)}>
                      Avbeställ
                    </button>
                  ))}
                {['DEMO_PAID', 'TEST_PAID'].includes(o.paymentStatus) &&
                  ['SHIPPED', 'DELIVERED'].includes(o.fulfillmentStatus) &&
                  o.returnStatus === 'NONE' && (
                    <>
                      <select
                        aria-label="Returorsak"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      >
                        <option>Passade inte</option>
                        <option>Fel vara</option>
                        <option>Skadad produkt</option>
                        <option>Ångrat köp</option>
                      </select>
                      <button
                        className="btn secondary"
                        onClick={() =>
                          void run(
                            'return',
                            { id: o.id, reason },
                            'Din returförfrågan är skapad',
                          ).catch(() => {})
                        }
                      >
                        Begär retur
                      </button>
                    </>
                  )}
                {o.returnStatus !== 'NONE' && (
                  <span className="status">{labelStatus(o.returnStatus)}</span>
                )}
                {['PAYMENT_FAILED', 'CANCELLED'].includes(o.orderStatus) && (
                  <Link className="btn yellow" href="/kassa">
                    Återförsök i kassan
                  </Link>
                )}
                <Link href="/hjalp">Få hjälp med ordern</Link>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className="empty white-section">
          <Package size={64} />
          <h2>Här börjar din orderhistoria</h2>
          <p>Gör ditt första demoköp, så dyker det upp här.</p>
          <Link className="btn yellow" href="/sok">
            Hitta något du gillar <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
export function WishlistsPage() {
  const { data, run, add, loading, notify } = useShop();
  const [listId, setListId] = useState('');
  if (loading) return <Loading />;
  const list = data?.lists.find((l) => l.id === listId) || data?.lists[0];
  return (
    <div className="content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SPARA DET DU GILLAR</p>
          <h1>Dina önskelistor</h1>
        </div>
      </div>
      <div className="account-layout">
        <aside className="white-section">
          <h3>Dina listor</h3>
          {data?.lists.map((l) => (
            <button
              className={`list-tab ${list?.id === l.id ? 'active' : ''}`}
              key={l.id}
              onClick={() => setListId(l.id)}
            >
              {l.name} <span>{l.items.length}</span>
            </button>
          ))}
          <ActionForm
            title="Skapa ny lista"
            fields={[{ name: 'name', label: 'Listnamn' }]}
            onSubmit={(v) => run('list-create', v, 'Ny lista skapad')}
          />
        </aside>
        <section className="white-section">
          <div className="section-heading">
            <h2>{list?.name}</h2>
            {list && (
              <button
                className="btn secondary"
                onClick={async () => {
                  const result = (await run('list', {
                    id: list.id,
                    items: list.items,
                    shared: !list.shareToken,
                  })) as { shareToken: string };
                  if (result.shareToken) {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/lista/${result.shareToken}`,
                    );
                    notify('Delningslänk kopierad. Alla med länken kan se listan.');
                  } else notify('Listan är nu privat');
                }}
              >
                {list.shareToken ? 'Gör privat' : 'Dela lista'}
              </button>
            )}
          </div>
          {list?.items.length ? (
            <div className="wishlist-grid">
              {list.items.map((id) => {
                const p = products.find((p) => p.id === id)!;
                return (
                  <div key={id}>
                    <ProductCard product={p} compact />
                    <div className="wishlist-actions">
                      <button
                        className="btn yellow"
                        onClick={async () => {
                          await add(p.variants[0].offers[0].id);
                          await run('list', {
                            id: list.id,
                            items: list.items.filter((x) => x !== id),
                          });
                        }}
                      >
                        Flytta till varukorg
                      </button>
                      <button
                        className="text-link"
                        onClick={() =>
                          void run(
                            'list',
                            { id: list.id, items: list.items.filter((x) => x !== id) },
                            'Borttagen',
                          ).catch(() => {})
                        }
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <Heart size={54} />
              <h3>Samla dina favoriter här</h3>
              <p>Tryck på hjärtat på en produkt för att spara den.</p>
              <Link href="/sok">Upptäck produkter →</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
