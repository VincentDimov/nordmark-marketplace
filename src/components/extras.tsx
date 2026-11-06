'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createAuthClient } from 'better-auth/react';
import {
  Check,
  Headphones,
  Store,
  ShieldCheck,
  Truck,
  Gift,
  Users,
  ArrowRight,
} from 'lucide-react';
import { products, sellers, money } from '@/lib/catalog';
import { useShop } from './shop-provider';
import { ActionForm } from './account';
import { ProductCard } from './product-card';
export function DemoPage() {
  const { data, run } = useShop();
  const router = useRouter();
  return (
    <div className="content-page">
      <section className="demo-intro">
        <p className="eyebrow">HELA RESAN, UTAN RIKTIGA TRANSAKTIONER</p>
        <h1>
          En marknadsplats.
          <br />
          Tre perspektiv.
        </h1>
        <p>
          Din miljö är privat och isolerad från andra besökare. Växla roll och följ samma order från
          första klick till leverans och retur.
        </p>
        <div className="demo-role-grid">
          {[
            {
              role: 'customer',
              title: 'Upptäck som kund',
              text: 'Sök bland 120 produkter, spara favoriter och genomför ett demoköp.',
              href: '/sok',
              Icon: Users,
            },
            {
              role: 'seller',
              title: 'Driv din demobutik',
              text: 'Uppdatera erbjudanden och lager, skicka order och svara på frågor.',
              href: '/portal',
              Icon: Store,
            },
            {
              role: 'admin',
              title: 'Hantera marknadsplatsen',
              text: 'Godkänn säljare, skapa kampanjer och hantera demoåterbetalningar.',
              href: '/admin',
              Icon: ShieldCheck,
            },
          ].map((r) => (
            <article key={r.role}>
              <r.Icon size={30} />
              <h2>{r.title}</h2>
              <p>{r.text}</p>
              <button
                className="btn yellow"
                onClick={async () => {
                  await run('role', { role: r.role, sellerId: 's1' });
                  router.push(r.href);
                }}
              >
                Prova {r.role === 'customer' ? 'kund' : r.role === 'seller' ? 'säljare' : 'admin'}{' '}
                <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="white-section">
        <h2>Din demo, redo att användas</h2>
        <p>
          Aktiv roll: <b>{data?.actor.role}</b>. Prova <b>HEJ10</b> för 10 % rabatt och presentkort{' '}
          <b>NORD250</b> med 250 kr startsaldo.
        </p>
        <p>
          Betalning, e-post, spårning och utbetalningar är simuleringar. Inga kortuppgifter behövs.
          Skapa gärna ett kundkonto med exempeluppgifter om du vill återvända till samma miljö från
          en annan webbläsare.
        </p>
        <p>
          Din demomiljö sparas i PostgreSQL och en säker sessionscookie i sju dagar. Riktiga
          administrativa konton och marknadsplatsutbetalningar ingår inte i det publika demoläget.
        </p>
      </section>
    </div>
  );
}
export function HelpPage() {
  const { data, run } = useShop();
  const [query, setQuery] = useState('');
  const faq = [
    [
      'Hur fungerar demoköp?',
      'Lägg en produkt i varukorgen och välj testutfall i kassan. En lyckad demobetalning skapar en order och minskar lagret i din miljö. Inga pengar flyttas.',
    ],
    [
      'När kommer min beställning?',
      'Leveransfönstren är exempel. Inga fysiska varor skickas. Prova säljarportalen för att markera din demoorder som skickad och levererad.',
    ],
    [
      'Hur gör jag en retur?',
      'Öppna din beställning när den är skickad, välj returorsak och begär retur. Administratören kan sedan godkänna en full eller partiell demoåterbetalning.',
    ],
    [
      'Kan jag avbeställa?',
      'Ja, en mottagen order som ännu inte skickats kan avbeställas från Mina beställningar. Lager och använt presentkortssaldo återställs.',
    ],
    [
      'Hur fungerar presentkort?',
      'Ange NORD250 i kassan. Saldo och transaktioner visas under Presentkort. Saldo dras atomärt vid lyckade demoköp.',
    ],
    [
      'Hur kontaktar jag en säljare?',
      'Skapa ett kundserviceärende här eller ställ en fråga på produktsidan. Ärendet finns sedan i din demomiljös portal.',
    ],
    [
      'Varför ser jag inte mina order?',
      'Du kan vara i en annan demomiljö. Logga in på samma kundkonto eller använd samma webbläsare där köpet gjordes.',
    ],
  ];
  return (
    <div className="content-page">
      <section className="help-hero">
        <Headphones size={36} />
        <p className="eyebrow">VI FINNS HÄR FÖR DIG</p>
        <h1>Vad kan vi hjälpa dig med?</h1>
        <input
          aria-label="Sök i hjälpcentret"
          placeholder="Sök bland vanliga frågor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </section>
      <div className="help-layout">
        <section className="white-section">
          <h2>Vanliga frågor</h2>
          {faq
            .filter(([q, a]) => `${q} ${a}`.toLowerCase().includes(query.toLowerCase()))
            .map(([q, a]) => (
              <details className="faq" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
        </section>
        <section className="white-section">
          <ActionForm
            title="Skapa ett kundserviceärende"
            fields={[
              { name: 'subject', label: 'Vad gäller det?' },
              {
                name: 'orderId',
                label: 'Koppla till order (valfritt)',
                required: false,
                options: [
                  { value: '', label: 'Ingen specifik order' },
                  ...(data?.orders.map((o) => ({ value: o.id, label: o.number })) || []),
                ],
              },
              { name: 'message', label: 'Ditt meddelande', type: 'textarea' },
            ]}
            button="Skicka till demokundservice"
            onSubmit={(v) => run('support', v, 'Ditt ärende är skapat')}
          />
        </section>
      </div>
      <section className="white-section">
        <h2>Dina ärenden</h2>
        {data?.support.length ? (
          data.support.map((t) => (
            <article className="portal-order" key={t.id}>
              <h3>
                {t.subject} · {t.status === 'OPEN' ? 'Öppet' : 'Avslutat'}
              </h3>
              {(t.messages as { author: string; text: string }[]).map((m, i) => (
                <p className="message" key={i}>
                  <b>{m.author}</b>
                  {m.text}
                </p>
              ))}
              <ActionForm
                fields={[{ name: 'message', label: 'Lägg till meddelande', type: 'textarea' }]}
                button="Skicka meddelande"
                onSubmit={(v) => run('support-reply', { ...v, id: t.id }, 'Meddelandet är skickat')}
              />
            </article>
          ))
        ) : (
          <p className="empty-small">Du har inga kundserviceärenden.</p>
        )}
      </section>
    </div>
  );
}
export function MembershipPage() {
  const { data, run } = useShop();
  return (
    <div className="content-page">
      <section className="membership-hero">
        <p className="eyebrow">NORDMARK PLUS</p>
        <h1>
          Lite extra.
          <br />
          Varje dag.
        </h1>
        <p>Mer av det du gillar. Mindre att tänka på.</p>
        <button
          className="btn yellow"
          onClick={() =>
            void run(
              'membership',
              { active: !data?.membership.active },
              data?.membership.active
                ? 'Demomedlemskapet är avslutat'
                : 'Välkommen till Nordmark Plus demo!',
            ).catch(() => {})
          }
        >
          {data?.membership.active ? 'Avsluta demomedlemskap' : 'Aktivera gratis demomedlemskap'}
        </button>
        <small>
          {data?.membership.active
            ? 'Ditt medlemskap är aktivt. Ingen avgift eller automatisk debitering.'
            : 'Gratis i demoläget. Ingen bindningstid eller debitering.'}
        </small>
      </section>
      <div className="benefit-grid">
        {[
          [Truck, 'Fri standardfrakt', 'På alla dina demoköp, oavsett ordervärde.'],
          [Gift, 'Mer att upptäcka', 'Samla dina favoriter och skapa återkommande köp.'],
          [ShieldCheck, 'Enkelt att hantera', 'Aktivera och avsluta när du vill, direkt här.'],
        ].map(([Icon, title, text], i) => {
          const I = Icon as typeof Truck;
          return (
            <article className="white-section" key={i}>
              <I size={30} />
              <h2>{String(title)}</h2>
              <p>{String(text)}</p>
              <Check />
            </article>
          );
        })}
      </div>
    </div>
  );
}
export function GiftPage() {
  const { data } = useShop();
  return (
    <div className="content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">LITE VARDAGSGLÄDJE ATT GE BORT</p>
          <h1>Presentkort & saldo</h1>
        </div>
        <Gift size={45} />
      </div>
      <div className="gift-grid">
        {data?.giftCards.map((g) => (
          <article className="gift-card" key={g.id}>
            <span className="logo">nordmark</span>
            <span>DEMOPRESENTKORT</span>
            <strong>{money(g.balance)}</strong>
            <code>{g.code}</code>
          </article>
        ))}
      </div>
      <section className="white-section">
        <h2>Så fungerar det</h2>
        <p>
          Ange presentkortskoden i kassan. Vi drar bara det belopp som behövs. Kvarvarande saldo
          sparas för framtida demoköp. Inga verkliga pengar är kopplade till korten.
        </p>
        <p>Administratören kan skapa och fylla på presentkort i din privata demomiljö.</p>
        <h3>Transaktionshistorik</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kod</th>
                <th>Belopp</th>
                <th>Typ</th>
              </tr>
            </thead>
            <tbody>
              {data?.giftTransactions.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.createdAt).toLocaleString('sv-SE')}</td>
                  <td>{t.code}</td>
                  <td>{money(t.amount)}</td>
                  <td>{t.amount > 0 ? 'Påfyllning / återbetalning' : 'Demoköp'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
export function SellerPage() {
  const { run } = useShop();
  return (
    <div className="content-page">
      <section className="seller-hero">
        <div>
          <p className="eyebrow">VÄX MED NORDMARK</p>
          <h1>
            Din butik.
            <br />
            En större värld.
          </h1>
          <p>
            Nå nya kunder med genomtänkta produkter och en shoppingupplevelse som gör det enkelt att
            välja dig.
          </p>
          <Link className="btn yellow" href="/portal">
            Utforska säljarportalen <ArrowRight size={17} />
          </Link>
        </div>
        <Store size={140} />
      </section>
      <div className="seller-grid">
        {sellers.map((s) => (
          <article className="white-section" key={s.id}>
            <Store />
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <p className="stars">★ {s.rating} / 5 · demosäljare</p>
            <Link href={`/butik/${s.id}`}>Besök butiken →</Link>
          </article>
        ))}
      </div>
      <section className="white-section">
        <ActionForm
          title="Ansök om att bli demosäljare"
          fields={[
            { name: 'company', label: 'Företagsnamn' },
            { name: 'registration', label: 'Organisationsnummer (10 siffror)' },
          ]}
          button="Skicka demoansökan"
          onSubmit={(v) =>
            run('seller-apply', v, 'Din ansökan inväntar godkännande i adminpanelen')
          }
        />
        <p className="muted">
          Den här ansökan skapar ingen verklig företagsrelation. Godkänn den genom att byta till
          admin i samma demomiljö.
        </p>
      </section>
    </div>
  );
}
export function ComparePage() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem('nordmark-compare') || '[]'));
    } catch {}
  }, []);
  const selected = ids.map((id) => products.find((p) => p.id === id)!).filter(Boolean);
  return (
    <div className="content-page">
      <h1>Jämför dina favoriter</h1>
      <p>Välj ”Jämför” på upp till fyra produktsidor.</p>
      {selected.length ? (
        <div className="table-wrap white-section">
          <table className="compare-table">
            <tbody>
              <tr>
                <th>Produkt</th>
                {selected.map((p) => (
                  <td key={p.id}>
                    <ProductCard product={p} compact />
                    <button
                      className="text-link"
                      onClick={() => {
                        const next = ids.filter((id) => id !== p.id);
                        setIds(next);
                        localStorage.setItem('nordmark-compare', JSON.stringify(next));
                      }}
                    >
                      Ta bort
                    </button>
                  </td>
                ))}
              </tr>
              {['Varumärke', 'Pris', 'Betyg', 'Kategori', 'Garanti'].map((k) => (
                <tr key={k}>
                  <th>{k}</th>
                  {selected.map((p) => (
                    <td key={p.id}>
                      {k === 'Varumärke'
                        ? p.brand
                        : k === 'Pris'
                          ? money(p.variants[0].offers[0].price)
                          : k === 'Betyg'
                            ? `${p.rating}/5`
                            : k === 'Kategori'
                              ? p.categoryId
                              : '2 år'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty white-section">
          <h2>Vad vill du jämföra?</h2>
          <Link className="btn yellow" href="/sok">
            Utforska produkter
          </Link>
        </div>
      )}
    </div>
  );
}
export function ResetPage() {
  const params = useSearchParams();
  const token = params.get('token');
  const router = useRouter();
  const client = createAuthClient();
  return (
    <div className="content-page white-section">
      <h1>Återställ lösenord</h1>
      {token ? (
        <ActionForm
          fields={[
            { name: 'password', label: 'Nytt lösenord (minst 10 tecken)', type: 'password' },
          ]}
          onSubmit={async (v) => {
            const r = await client.resetPassword({ newPassword: v.password, token });
            if (r.error) throw Error(r.error.message);
            router.push('/konto');
          }}
        />
      ) : (
        <p>
          Öppna återställningslänken i ditt e-postmeddelande. I demoläget lagras länken i e-postkön.
        </p>
      )}
    </div>
  );
}
