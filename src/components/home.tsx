'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Store,
  ArrowUpRight,
} from 'lucide-react';
import { products, categories } from '@/lib/catalog';
import { ProductRail } from './product-card';
import { useShop } from './shop-provider';
const slides = [
  {
    eyebrow: 'HEMMA ÄR DÄR DET BÖRJAR',
    title: 'Lite mer hemkänsla.\nLite mindre prislapp.',
    text: 'Upptäck genomtänkta detaljer för en skönare vardag.',
    cta: 'Hitta dina hemmafavoriter',
    href: '/sok?category=hem',
    theme: 'home',
  },
  {
    eyebrow: 'SMARTARE VARJE DAG',
    title: 'Ny teknik.\nNya möjligheter.',
    text: 'Från arbetsdagen till spellistan. Hitta din nästa uppgradering.',
    cta: 'Utforska elektronik',
    href: '/sok?category=elektronik',
    theme: 'tech',
  },
  {
    eyebrow: 'UTVALT FÖR DIG',
    title: 'Små fynd.\nStor vardagsglädje.',
    text: 'Nya upptäckter och fina priser i hela butiken.',
    cta: 'Se veckans erbjudanden',
    href: '/sok?deals=1',
    theme: 'deals',
  },
];
export function Home() {
  const [slide, setSlide] = useState(0);
  const { data } = useShop();
  const s = slides[slide];
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem('nordmark-recent') || '[]'));
    } catch {}
  }, []);
  const categoryCards = [
    {
      title: 'Gör plats för mer hem',
      ids: ['hem', 'kok', 'skonhet', 'mat'],
      link: '/sok?category=hem',
      cta: 'Allt för hemmet',
    },
    {
      title: 'Din vardag. Uppgraderad.',
      ids: ['elektronik', 'mobiltillbehor', 'sport', 'accessoarer'],
      link: '/sok?category=elektronik',
      cta: 'Upptäck smarta favoriter',
    },
    {
      title: 'Stil som känns som du',
      ids: ['dammode', 'herrmode', 'skor', 'parfym'],
      link: '/sok?category=dammode',
      cta: 'Hitta din nya stil',
    },
  ];
  return (
    <div className="home-page">
      <section className={`hero hero-${s.theme}`} aria-roledescription="karusell">
        <img
          className="hero-photo"
          src="/images/hero-home.jpg"
          alt="Ljust skandinaviskt vardagsrum med grönska och naturliga material"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">{s.eyebrow}</p>
          <h1>
            {s.title.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </h1>
          <p>{s.text}</p>
          <Link className="hero-cta" href={s.href}>
            {s.cta}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-controls">
          <button aria-label="Föregående kampanj" onClick={() => setSlide((slide + 2) % 3)}>
            <ChevronLeft size={19} />
          </button>
          <span>
            0{slide + 1} <i>/ 03</i>
          </span>
          <button aria-label="Nästa kampanj" onClick={() => setSlide((slide + 1) % 3)}>
            <ChevronRight size={19} />
          </button>
        </div>
        <div className="hero-stamp">
          <span>UPP TILL</span>
          <b>
            35<span>%</span>
          </b>
          <span>PÅ UTVALDA FAVORITER</span>
        </div>
      </section>
      <div className="home-content">
        <section className="category-overlap">
          {categoryCards.map((card) => (
            <article className="category-card" key={card.title}>
              <h2>{card.title}</h2>
              <div className="category-quad">
                {card.ids.map((id) => {
                  const c = categories.find((c) => c.id === id)!;
                  return (
                    <Link href={`/sok?category=${c.id}`} key={id}>
                      <div>
                        <img src={c.image} alt="" width={160} height={100} />
                      </div>
                      <span>{c.name}</span>
                    </Link>
                  );
                })}
              </div>
              <Link className="text-link" href={card.link}>
                {card.cta} <span>→</span>
              </Link>
            </article>
          ))}
          <article className="category-card plus-card">
            <p className="eyebrow">MÖT NORDMARK PLUS</p>
            <h2>
              Lite extra.
              <br />
              Varje dag.
            </h2>
            <p>Fri standardfrakt på alla demoköp och samlade medlemsförmåner.</p>
            <div className="plus-orbit">
              <span>
                n<span>+</span>
              </span>
              <i>EN ENKLARE VARDAG</i>
            </div>
            <Link href="/medlemskap" className="btn yellow">
              Upptäck Plus <ArrowUpRight size={16} />
            </Link>
            <small>Gratis att prova i demoläget</small>
          </article>
        </section>
        <section className="trust-bar">
          <div>
            <Truck />
            <span>
              <b>Smidiga leveranser</b>
              <small>Fri frakt från 499 kr</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <b>Tryggt att handla</b>
              <small>Säker & simulerad checkout</small>
            </span>
          </div>
          <div>
            <RotateCcw />
            <span>
              <b>30 dagars öppet köp</b>
              <small>Enkelt hela vägen</small>
            </span>
          </div>
          <div>
            <Store />
            <span>
              <b>Fler butiker. Ett ställe.</b>
              <small>Fem utvalda demosäljare</small>
            </span>
          </div>
        </section>
        <ProductRail
          title="Dagens fynd, morgondagens favoriter"
          subtitle="BRA SAKER. ÄNNU BÄTTRE PRISER."
          items={[
            products[0],
            products[22],
            products[80],
            products[31],
            products[60],
            products[101],
          ]}
          href="/sok?deals=1"
        />
        <section className="editorial-banner">
          <div>
            <p className="eyebrow">VARDAGEN, FAST LITE FINARE</p>
            <h2>
              Små detaljer.
              <br />
              Stor skillnad.
            </h2>
            <p>Fyll hemmet med saker du tycker om.</p>
            <Link href="/sok?category=hem">Utforska hem & inredning →</Link>
          </div>
          <img src="/images/p023.webp" alt="Inredningsdetalj för hemmet" />
          <div className="editorial-note">
            UTVALT FÖR
            <br />
            <b>ditt hem.</b>
          </div>
        </section>
        <ProductRail
          title="Det här gillar andra just nu"
          subtitle="VÅRA MEST OMTYCKTA"
          items={[...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6)}
          href="/sok?sort=popular"
        />
        <section className="all-categories">
          <div className="section-heading">
            <h2>Vad vill du upptäcka idag?</h2>
            <Link href="/sok">Alla kategorier →</Link>
          </div>
          <div>
            {categories.map((c) => (
              <Link href={`/sok?category=${c.id}`} key={c.id}>
                <span>
                  <img src={c.image} alt="" loading="lazy" width={110} height={110} />
                </span>
                <b>{c.name}</b>
              </Link>
            ))}
          </div>
        </section>
        {recent.length > 0 && (
          <ProductRail
            title="Fortsätt där du var"
            subtitle="NYLIGEN VISADE"
            items={recent
              .map((id) => products.find((p) => p.id === id)!)
              .filter(Boolean)
              .slice(0, 6)}
          />
        )}
        <ProductRail
          title={data?.orders.length ? 'Mer att tycka om, utvalt för dig' : 'Nytt att upptäcka'}
          subtitle="NÄSTA FAVORIT VÄNTAR"
          items={products.slice(110, 116)}
          href="/sok?sort=new"
        />
        <section className="newsletter">
          <div>
            <p className="eyebrow">VÄLKOMMEN TILL NORDMARK</p>
            <h2>Hela din vardag. På ett ställe.</h2>
            <p>Från första upptäckten till din nästa favorit.</p>
          </div>
          <Link className="btn yellow" href="/konto">
            Skapa ditt konto <ArrowUpRight size={18} />
          </Link>
        </section>
      </div>
    </div>
  );
}
