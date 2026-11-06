'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  RotateCcw,
  Users,
  TicketPercent,
  Headphones,
  Star,
  Settings,
  ScrollText,
  Download,
  Upload,
  Store,
  TrendingUp,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { products, categories, sellers, money, findOffer } from '@/lib/catalog';
import { useShop } from './shop-provider';
import { Loading } from './cart-checkout';
import { ActionForm, labelStatus } from './account';
export function Portal({ admin = false }: { admin?: boolean }) {
  const { data, run, loading, notify } = useShop();
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sellerId, setSellerId] = useState('s1');
  if (loading) return <Loading />;
  const role = admin ? 'admin' : 'seller';
  if (data?.actor.role !== role)
    return (
      <div className="content-page empty white-section">
        <Shield />
        <p className="eyebrow">DIN PRIVATA DEMOMILJÖ</p>
        <h1>{admin ? 'Administrera Nordmark' : 'Din butik. Dina möjligheter.'}</h1>
        <p>
          Prova {admin ? 'adminpanelen' : 'säljarportalen'} i din isolerade demobutik. Endast din
          egen miljös produkter och order påverkas.
        </p>
        {!admin && (
          <label>
            Välj demosäljare
            <select value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="btn yellow"
          onClick={() =>
            void run(
              'role',
              { role, sellerId },
              `${admin ? 'Admin' : 'Säljar'}läget är aktiverat`,
            ).catch(() => {})
          }
        >
          Öppna {admin ? 'adminpanelen' : 'säljarportalen'} <ArrowUpRight size={17} />
        </button>
        <Link href="/demo">Läs om demoläget</Link>
      </div>
    );
  const sid = data.actor.sellerId;
  const orders = data.orders.filter((o) => admin || o.items.some((i) => i.sellerId === sid));
  const paid = orders.filter(
    (o) =>
      ['DEMO_PAID', 'TEST_PAID', 'DEMO_PARTIAL_REFUND'].includes(o.paymentStatus) &&
      o.orderStatus === 'PLACED',
  );
  const revenue = paid.reduce(
    (sum, o) =>
      sum +
      o.items
        .filter((i) => admin || i.sellerId === sid)
        .reduce((s, i) => s + i.price * i.quantity, 0),
    0,
  );
  const commission = Math.round(revenue * 0.12);
  const offers = products
    .flatMap((p) => p.variants.flatMap((v) => v.offers.map((o) => ({ p, v, o }))))
    .filter(
      ({ p, o }) =>
        (admin || o.sellerId === sid) &&
        `${p.title} ${p.brand} ${o.sku}`.toLowerCase().includes(query.toLowerCase()),
    );
  const tabs: [string, string, typeof Store][] = [
    ['overview', 'Översikt', LayoutDashboard],
    ['products', 'Produkter & lager', Package],
    ['orders', 'Order & leveranser', ShoppingBag],
    ['returns', 'Returer & återbetalning', RotateCcw],
    ...(admin
      ? ([
          ['sellers', 'Säljare & roller', Users],
          ['campaigns', 'Kampanjer & presentkort', TicketPercent],
        ] as [string, string, typeof Store][])
      : []),
    ['support', 'Kundservice', Headphones],
    ['reviews', 'Recensioner & frågor', Star],
    ['settings', 'Inställningar', Settings],
    ...(admin
      ? ([['audit', 'Revisionslogg', ScrollText]] as [string, string, typeof Store][])
      : []),
  ];
  async function exportCSV() {
    const rows = [
      ['offerId', 'title', 'priceOre', 'stock', 'sku'],
      ...offers.map(({ p, o }) => {
        const i = data!.inventory.find((i) => i.offerId === o.id);
        return [
          o.id,
          i?.title || p.title,
          String(i?.price ?? o.price),
          String(i?.stock ?? o.stock),
          o.sku,
        ];
      }),
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${v.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nordmark-produkter.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="portal-page">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <Store />
          <span>
            nordmark <small>{admin ? 'ADMINISTRATION' : 'SELLER CENTRAL'}</small>
          </span>
        </div>
        <p className="sandbox-label">ISOLERAD DEMOMILJÖ</p>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(String(id))}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <Link href="/demo">Byt demoroll →</Link>
        <Link href="/">Till butiken ↗</Link>
      </aside>
      <div className="portal-main">
        <div className="portal-heading">
          <div>
            <p className="eyebrow">
              {admin ? 'PLATTFORMSÖVERSIKT' : sellers.find((s) => s.id === sid)?.name}
            </p>
            <h1>{tabs.find((t) => t[0] === tab)?.[1]}</h1>
          </div>
          <span className="status">Demodata · inga verkliga utbetalningar</span>
        </div>
        {tab === 'overview' && (
          <>
            <div className="stats-grid">
              <Stat label="Bruttoförsäljning" value={money(revenue)} icon={<TrendingUp />} />
              <Stat label="Betalda order" value={String(paid.length)} icon={<ShoppingBag />} />
              <Stat
                label="Marknadsplatsprovision · 12 %"
                value={money(commission)}
                icon={<TicketPercent />}
              />
              <Stat
                label="Simulerat utbetalningssaldo"
                value={money(revenue - commission)}
                icon={<Wallet />}
              />
            </div>
            <section className="white-section">
              <div className="section-heading">
                <h2>Senaste order</h2>
                <button className="text-link" onClick={() => setTab('orders')}>
                  Se alla →
                </button>
              </div>
              {orders.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Datum</th>
                        <th>Belopp</th>
                        <th>Betalning</th>
                        <th>Leverans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map((o) => (
                        <tr key={o.id}>
                          <td>{o.number}</td>
                          <td>{new Date(o.createdAt).toLocaleDateString('sv-SE')}</td>
                          <td>
                            {money(
                              admin
                                ? o.total
                                : o.items
                                    .filter((i) => i.sellerId === sid)
                                    .reduce((s, i) => s + i.price * i.quantity, 0),
                            )}
                          </td>
                          <td>{labelStatus(o.paymentStatus)}</td>
                          <td>{labelStatus(o.fulfillmentStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-small">
                  <h3>Redo för den första ordern</h3>
                  <p>Byt till kund, genomför ett demoköp och hantera sedan ordern här.</p>
                  <Link href="/demo">Gör ett demoköp →</Link>
                </div>
              )}
            </section>
            <section className="white-section">
              <h2>Försäljning per kategori</h2>
              {categories.map((c) => {
                const sum = paid.reduce(
                  (s, o) =>
                    s +
                    o.items
                      .filter(
                        (i) =>
                          (admin || i.sellerId === sid) &&
                          products.find((p) => p.id === i.productId)?.categoryId === c.id,
                      )
                      .reduce((s, i) => s + i.price * i.quantity, 0),
                  0,
                );
                return (
                  <div key={c.id} className="report-row">
                    <span>{c.name}</span>
                    <i>
                      <b style={{ width: `${revenue ? (sum / revenue) * 100 : 0}%` }} />
                    </i>
                    <b>{money(sum)}</b>
                  </div>
                );
              })}
            </section>
          </>
        )}
        {tab === 'products' && (
          <section className="white-section">
            <div className="section-heading">
              <h2>
                {admin ? 'Produktkatalog' : 'Dina erbjudanden'} · {offers.length}
              </h2>
              <div className="button-row">
                <button className="btn secondary" onClick={() => void exportCSV()}>
                  <Download size={15} />
                  Exportera CSV
                </button>
                <label className="btn secondary file-upload">
                  <Upload size={15} />
                  Importera CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 100000) {
                        notify('Filen får vara högst 100 kB.');
                        return;
                      }
                      try {
                        const text = await file.text();
                        const lines = text
                          .replace(/^\uFEFF/, '')
                          .trim()
                          .split(/\r?\n/)
                          .slice(1);
                        for (const line of lines) {
                          const values = [...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map((m) =>
                            m[1].replaceAll('""', '"'),
                          );
                          if (values.length !== 5) throw Error('Använd formatet från exportfilen.');
                          await run('inventory', {
                            id: values[0],
                            title: values[1],
                            price: Number(values[2]),
                            stock: Number(values[3]),
                          });
                        }
                        notify(`${lines.length} erbjudanden uppdaterade`);
                      } catch (err) {
                        notify(err instanceof Error ? err.message : 'Importen misslyckades.');
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <input
              className="portal-search"
              aria-label="Sök i produktkatalogen"
              placeholder="Sök produkt, varumärke eller SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produkt / variant</th>
                    <th>SKU</th>
                    <th>Pris</th>
                    <th>Lager</th>
                    <th>Säljare</th>
                    <th>Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.slice(0, 60).map(({ p, v, o }) => {
                    const inv = data.inventory.find((i) => i.offerId === o.id);
                    return (
                      <tr key={o.id}>
                        <td>
                          <div className="table-product">
                            <img src={v.image} alt="" width={44} height={44} />
                            <span>
                              <b>{inv?.title || p.title}</b>
                              <small>{v.name}</small>
                            </span>
                          </div>
                        </td>
                        <td>{o.sku}</td>
                        <td>{money(inv?.price ?? o.price)}</td>
                        <td>
                          <span
                            className={`stock-pill ${(inv?.stock ?? o.stock) === 0 ? 'zero' : ''}`}
                          >
                            {inv?.stock ?? o.stock} st
                          </span>
                        </td>
                        <td>{sellers.find((s) => s.id === o.sellerId)?.name}</td>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => setEditing(editing === o.id ? '' : o.id)}
                          >
                            Redigera
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {offers.length > 60 && (
              <p className="muted">
                Visar de första 60 erbjudandena. Sök för att avgränsa eller exportera hela urvalet.
              </p>
            )}
            {editing &&
              (() => {
                const m = findOffer(editing)!;
                const inv = data.inventory.find((i) => i.offerId === editing);
                return (
                  <ActionForm
                    key={editing}
                    title={`Redigera ${m.product.title} · ${m.variant.name}`}
                    fields={[
                      { name: 'title', label: 'Produktnamn', value: inv?.title || m.product.title },
                      {
                        name: 'price',
                        label: 'Pris i kronor',
                        type: 'number',
                        value: String((inv?.price ?? m.offer.price) / 100),
                      },
                      {
                        name: 'image',
                        label: 'Produktbild (uppladdad URL)',
                        required: false,
                        value: inv?.image || m.variant.image,
                      },
                      {
                        name: 'stock',
                        label: 'Lagersaldo',
                        type: 'number',
                        value: String(inv?.stock ?? m.offer.stock),
                      },
                    ]}
                    onSubmit={async (v) => {
                      await run(
                        'inventory',
                        {
                          id: editing,
                          title: v.title,
                          price: Math.round(Number(v.price) * 100),
                          stock: Number(v.stock),
                          image: v.image || undefined,
                        },
                        'Produkten är uppdaterad i din demomiljö',
                      );
                      setEditing('');
                    }}
                  >
                    <label>
                      Byt produktbild (JPEG, PNG, WebP · högst 2 MB)
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const form = new FormData();
                          form.set('file', file);
                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: form,
                          });
                          const result = await response.json();
                          if (!response.ok) {
                            notify(result.error);
                            return;
                          }
                          const input = document.querySelector<HTMLInputElement>('[name="image"]');
                          if (input) input.value = result.url;
                          notify('Bilden är uppladdad. Spara produkten för att använda den.');
                        }}
                      />
                    </label>
                  </ActionForm>
                );
              })()}
          </section>
        )}
        {tab === 'orders' && (
          <section className="white-section">
            <h2>Order & försändelser</h2>
            {orders.map((o) => (
              <article className="portal-order" key={o.id}>
                <div className="section-heading">
                  <h3>{o.number}</h3>
                  <span>{labelStatus(o.paymentStatus)}</span>
                </div>
                <p>
                  {o.items
                    .filter((i) => admin || i.sellerId === sid)
                    .map((i) => `${i.quantity} × ${i.title}`)
                    .join(' · ')}
                </p>
                {o.shipments
                  .filter((s) => admin || s.sellerId === sid)
                  .map((s) => (
                    <div className="shipment" key={s.id}>
                      <span>
                        {sellers.find((x) => x.id === s.sellerId)?.name} ·{' '}
                        <b>{labelStatus(s.status)}</b>
                      </span>
                      <small>{s.tracking}</small>
                      {o.orderStatus === 'PLACED' &&
                        ['DEMO_PAID', 'TEST_PAID'].includes(o.paymentStatus) &&
                        s.status !== 'DELIVERED' && (
                          <button
                            className="btn yellow"
                            onClick={() =>
                              void run(
                                'ship',
                                {
                                  id: s.id,
                                  status: s.status === 'PROCESSING' ? 'SHIPPED' : 'DELIVERED',
                                },
                                'Försändelsen är uppdaterad',
                              ).catch(() => {})
                            }
                          >
                            {s.status === 'PROCESSING'
                              ? 'Bekräfta simulerad leverans'
                              : 'Markera levererad'}
                          </button>
                        )}
                    </div>
                  ))}
              </article>
            ))}
            {!orders.length && (
              <p className="empty-small">Inga order ännu. Genomför ett köp i kundläget först.</p>
            )}
          </section>
        )}
        {tab === 'returns' && (
          <section className="white-section">
            <h2>Returärenden</h2>
            {data.returns.length ? (
              data.returns
                .filter((r) => orders.some((o) => o.id === r.orderId))
                .map((r) => {
                  const order = orders.find((o) => o.id === r.orderId)!;
                  return (
                    <article className="portal-order" key={r.id}>
                      <h3>{order.number}</h3>
                      <p>Orsak: {r.reason}</p>
                      <p>
                        Status: {labelStatus(r.status)} · {money(r.amount)}
                      </p>
                      {admin &&
                        r.status === 'REQUESTED' &&
                        (confirm === r.id ? (
                          <ActionForm
                            fields={[
                              {
                                name: 'amount',
                                label: 'Belopp att demoåterbetala (kr)',
                                type: 'number',
                                value: String(r.amount / 100),
                              },
                            ]}
                            button="Bekräfta återbetalning"
                            onSubmit={async (v) => {
                              await run(
                                'refund',
                                { id: r.orderId, amount: Math.round(Number(v.amount) * 100) },
                                'Demoåterbetalning genomförd',
                              );
                              setConfirm('');
                            }}
                          />
                        ) : (
                          <button className="btn orange" onClick={() => setConfirm(r.id)}>
                            Granska & återbetala
                          </button>
                        ))}
                      {!admin && (
                        <p>Återbetalning godkänns av administratören i denna demomiljö.</p>
                      )}
                    </article>
                  );
                })
            ) : (
              <p className="empty-small">
                Inga returer att hantera. Kunden kan begära retur efter att ordern skickats.
              </p>
            )}
          </section>
        )}
        {tab === 'sellers' && (
          <>
            <section className="white-section">
              <h2>Säljare i marknadsplatsen</h2>
              <div className="seller-grid">
                {sellers.map((s) => (
                  <article key={s.id}>
                    <Store />
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                    <p className="stars">★ {s.rating}/5</p>
                    <Link href={`/butik/${s.id}`}>Visa butik →</Link>
                  </article>
                ))}
              </div>
              <h2>Säljaransökningar</h2>
              {data.applications.map((s) => (
                <article className="subscription-row" key={s.id}>
                  <div>
                    <b>{s.company}</b>
                    <p>
                      {s.registration} · {s.status}
                    </p>
                  </div>
                  {s.status === 'PENDING' && (
                    <>
                      <button
                        className="btn yellow"
                        onClick={() =>
                          void run(
                            'seller-approve',
                            { id: s.id, status: 'APPROVED' },
                            'Säljaren är godkänd i demomiljön',
                          ).catch(() => {})
                        }
                      >
                        Godkänn
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() =>
                          void run(
                            'seller-approve',
                            { id: s.id, status: 'REJECTED' },
                            'Ansökan avslagen',
                          ).catch(() => {})
                        }
                      >
                        Avslå
                      </button>
                    </>
                  )}
                </article>
              ))}
              {!data.applications.length && (
                <p>
                  Inga ansökningar ännu. <Link href="/saljare">Skapa en demoansökan.</Link>
                </p>
              )}
              <h2>Demoroller & behörigheter</h2>
              <p>
                Kund, säljare och administratör är separata serverkontrollerade roller i din privata
                demomiljö. Inga publika produktionsadministratörer skapas.
              </p>
              <Link href="/demo">Hantera din aktiva demoroll →</Link>
            </section>
            <section className="white-section">
              <h2>Kategorier & varumärken</h2>
              <p>
                {categories.length} kategorier · {[...new Set(products.map((p) => p.brand))].length}{' '}
                varumärken
              </p>
              <div className="tag-list">
                {categories.map((c) => (
                  <Link href={`/sok?category=${c.id}`} key={c.id}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
        {tab === 'campaigns' && (
          <>
            <section className="white-section">
              <h2>Rabattkoder</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Kod</th>
                      <th>Rabatt</th>
                      <th>Användningar</th>
                      <th>Giltig till</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.coupons.map((c) => (
                      <tr key={c.code}>
                        <td>{c.code}</td>
                        <td>{c.percent} %</td>
                        <td>
                          {c.used} / {c.limit}
                        </td>
                        <td>{new Date(c.expiresAt).toLocaleDateString('sv-SE')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ActionForm
                title="Skapa eller uppdatera rabattkod"
                fields={[
                  { name: 'code', label: 'Kod (A–Z, 0–9)' },
                  { name: 'percent', label: 'Rabatt i %', type: 'number', value: '10' },
                  { name: 'limit', label: 'Max användningar', type: 'number', value: '10' },
                  {
                    name: 'expiresAt',
                    label: 'Sista giltighetsdag',
                    type: 'date',
                    value: '2027-12-31',
                  },
                ]}
                onSubmit={(v) =>
                  run(
                    'coupon',
                    {
                      ...v,
                      percent: Number(v.percent),
                      limit: Number(v.limit),
                      expiresAt: new Date(v.expiresAt).toISOString(),
                    },
                    'Rabattkoden är sparad',
                  )
                }
              />
            </section>
            <section className="white-section">
              <h2>Presentkort</h2>
              {data.giftCards.map((g) => (
                <p key={g.id}>
                  <b>{g.code}</b> · saldo {money(g.balance)}
                </p>
              ))}
              <ActionForm
                title="Skapa eller fyll på demopresentkort"
                fields={[
                  { name: 'code', label: 'Presentkortskod' },
                  { name: 'amount', label: 'Belopp (kr)', type: 'number', value: '250' },
                ]}
                onSubmit={(v) =>
                  run(
                    'gift',
                    { code: v.code, amount: Math.round(Number(v.amount) * 100) },
                    'Presentkortet är påfyllt',
                  )
                }
              />
            </section>
          </>
        )}
        {tab === 'support' && (
          <section className="white-section">
            <h2>Kundserviceärenden</h2>
            {data.support.map((t) => (
              <article className="portal-order" key={t.id}>
                <h3>
                  {t.subject} · {t.status}
                </h3>
                {(t.messages as { author: string; text: string; at: string }[]).map((m, i) => (
                  <p className="message" key={i}>
                    <b>{m.author}</b> {m.text}
                  </p>
                ))}
                <ActionForm
                  fields={[{ name: 'message', label: 'Svara på ärendet', type: 'textarea' }]}
                  button="Skicka svar"
                  onSubmit={(v) =>
                    run('support-reply', { id: t.id, message: v.message }, 'Svaret är skickat')
                  }
                />
                <button
                  className="text-link"
                  onClick={() =>
                    void run(
                      'support-reply',
                      { id: t.id, message: 'Ärendet är avslutat av kundservice.', close: true },
                      'Ärendet är stängt',
                    ).catch(() => {})
                  }
                >
                  Avsluta ärende
                </button>
              </article>
            ))}
            {!data.support.length && (
              <p className="empty-small">
                Inga ärenden ännu. Kunden kan skapa ett via hjälpcentret.
              </p>
            )}
          </section>
        )}
        {tab === 'reviews' && (
          <section className="white-section">
            <h2>Recensioner & produktfrågor</h2>
            {data.reviews
              .filter(
                (r) =>
                  admin ||
                  products
                    .find((p) => p.id === r.productId)
                    ?.variants.some((v) => v.offers.some((o) => o.sellerId === sid)),
              )
              .map((r) => (
                <article className="review" key={r.id}>
                  <b>
                    {r.title} · {r.rating}/5
                  </b>
                  <p>{r.body}</p>
                  <small>
                    Demorecension · {r.verified ? 'verifierat demoköp' : 'ej verifierad'}
                  </small>
                  {admin && (
                    <button
                      className="text-link"
                      onClick={() =>
                        void run(
                          'review-delete',
                          { id: r.id },
                          'Recensionen har modererats bort',
                        ).catch(() => {})
                      }
                    >
                      Ta bort recension
                    </button>
                  )}
                </article>
              ))}
            {data.questions
              .filter(
                (q) =>
                  admin ||
                  products
                    .find((p) => p.id === q.productId)
                    ?.variants.some((v) => v.offers.some((o) => o.sellerId === sid)),
              )
              .map((q) => (
                <article className="question" key={q.id}>
                  <b>{q.question}</b>
                  <p>{q.answer}</p>
                  <ActionForm
                    fields={[{ name: 'answer', label: 'Svar', value: q.answer || '' }]}
                    onSubmit={(v) =>
                      run('answer', { id: q.id, answer: v.answer }, 'Svaret är publicerat')
                    }
                  />
                </article>
              ))}
            {!data.reviews.length && !data.questions.length && (
              <p className="empty-small">Här visas recensioner och frågor från din demomiljö.</p>
            )}
          </section>
        )}
        {tab === 'settings' && (
          <section className="white-section">
            <h2>{admin ? 'Butiksinställningar' : 'Företagsprofil & frakt'}</h2>
            <ActionForm
              fields={
                admin
                  ? [
                      {
                        name: 'banner',
                        label: 'Kampanjmeddelande',
                        value: String(data.settings.banner || 'Välkommen till Nordmark'),
                      },
                      {
                        name: 'contact',
                        label: 'Kontaktadress',
                        value: String(data.settings.contact || 'demo@nordmark.example'),
                      },
                      {
                        name: 'freeShippingThreshold',
                        label: 'Fri frakt från (kr)',
                        type: 'number',
                        value: String(Number(data.settings.freeShippingThreshold ?? 49900) / 100),
                      },
                      {
                        name: 'standardShipping',
                        label: 'Standardfrakt (kr)',
                        type: 'number',
                        value: String(Number(data.settings.standardShipping ?? 4900) / 100),
                      },
                      {
                        name: 'expressShipping',
                        label: 'Expresstillägg (kr)',
                        type: 'number',
                        value: String(Number(data.settings.expressShipping ?? 3900) / 100),
                      },
                      {
                        name: 'taxPercent',
                        label: 'Inkluderad moms (%)',
                        type: 'number',
                        value: String(data.settings.taxPercent ?? 25),
                      },
                    ]
                  : [
                      {
                        name: 'company',
                        label: 'Företagsnamn',
                        value: String(
                          data.settings[`company_${sid}`] ||
                            sellers.find((s) => s.id === sid)?.name,
                        ),
                      },
                      {
                        name: 'description',
                        label: 'Beskrivning',
                        value: String(
                          data.settings[`description_${sid}`] ||
                            sellers.find((s) => s.id === sid)?.description,
                        ),
                      },
                      {
                        name: 'dispatchDays',
                        label: 'Hanteringstid (dagar)',
                        type: 'number',
                        value: String(data.settings[`dispatchDays_${sid}`] || 2),
                      },
                    ]
              }
              onSubmit={(v) =>
                run(
                  'settings',
                  {
                    settings: admin
                      ? {
                          ...v,
                          freeShippingThreshold: Math.round(Number(v.freeShippingThreshold) * 100),
                          standardShipping: Math.round(Number(v.standardShipping) * 100),
                          expressShipping: Math.round(Number(v.expressShipping) * 100),
                          taxPercent: Number(v.taxPercent),
                        }
                      : Object.fromEntries(
                          Object.entries(v).map(([k, val]) => [`${k}_${sid}`, val]),
                        ),
                  },
                  'Inställningarna är sparade',
                )
              }
            />
            <h3>Frakt & moms</h3>
            <p>
              Standardfrakt {money(Number(data.settings.standardShipping ?? 4900))}, fri över{' '}
              {money(Number(data.settings.freeShippingThreshold ?? 49900))}. Expresstillägg{' '}
              {money(Number(data.settings.expressShipping ?? 3900))}. Moms{' '}
              {String(data.settings.taxPercent ?? 25)} % ingår i visade priser. Priser lagras i hela
              ören och order sparar en ögonblicksbild.
            </p>
            <p>
              Utbetalningar, frakt och e-post är simulerade. Inga riktiga tjänster eller kort
              aktiveras via den här panelen.
            </p>
          </section>
        )}
        {tab === 'audit' && (
          <section className="white-section">
            <h2>Revisionslogg</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tid</th>
                    <th>Roll</th>
                    <th>Åtgärd</th>
                    <th>Resurs</th>
                  </tr>
                </thead>
                <tbody>
                  {data.audit.map((l) => (
                    <tr key={l.id}>
                      <td>{new Date(l.createdAt).toLocaleString('sv-SE')}</td>
                      <td>{l.actor}</td>
                      <td>{l.action}</td>
                      <td>{l.resource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.audit.length && (
              <p className="empty-small">Ändringar av produkter och återbetalningar loggas här.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <article className="stat-card">
      <span>
        {label}
        {icon}
      </span>
      <strong>{value}</strong>
      <small>Beräknat från din demomiljös order</small>
    </article>
  );
}
function Shield() {
  return <div className="empty-icon">n+</div>;
}
