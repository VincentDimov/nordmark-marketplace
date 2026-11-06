'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  ShoppingCart,
  MapPin,
  Menu,
  ChevronDown,
  X,
  User,
  Package,
  Heart,
  Headphones,
  ArrowRight,
} from 'lucide-react';
import { categories } from '@/lib/catalog';
import { useShop } from './shop-provider';
export function Header() {
  const { data, currency, setCurrency, run } = useShop();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; image: string }[]>(
    [],
  );
  const [menu, setMenu] = useState(false);
  const [location, setLocation] = useState(false);
  const [postcode, setPostcode] = useState('111 22');
  useEffect(() => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/shop?search=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then(setSuggestions)
        .catch(() => {});
    }, 220);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);
  return (
    <>
      <a href="#main" className="skip-link">
        Hoppa till innehåll
      </a>
      <header>
        <div className="header-main">
          <Link href="/" className="logo" aria-label="Nordmark startsida">
            {process.env.NEXT_PUBLIC_STORE_NAME || 'nordmark'}
            <span />
          </Link>
          <button className="delivery head-hover" onClick={() => setLocation(true)}>
            <MapPin size={20} />
            <span>
              Leverera till<strong>{String(data?.settings?.postcode || 'Stockholm 111 22')}</strong>
            </span>
          </button>
          <form className="searchbar" action="/sok" onSubmit={() => setSuggestions([])}>
            <select
              name="category"
              aria-label="Sök i kategori"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Alla</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              autoComplete="off"
              name="q"
              placeholder="Sök bland dina nästa favoriter"
              aria-label="Sök produkter"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            />
            <button aria-label="Sök" type="submit">
              <Search size={26} />
            </button>
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/produkt/${s.id}`}
                    onClick={() => {
                      setQ('');
                      setSuggestions([]);
                    }}
                  >
                    <Search size={16} />
                    <span>{s.title}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            )}
          </form>
          <label className="locale">
            <span>🇸🇪</span>
            <select
              aria-label="Valuta"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="SEK">SE / SEK</option>
              <option value="EUR">SE / EUR*</option>
            </select>
          </label>
          <Link href="/konto" className="head-hover account-link">
            <small>Hej, {data?.actor.name || 'logga in'}</small>
            <strong>
              Konto & listor <ChevronDown size={12} />
            </strong>
          </Link>
          <Link href="/bestallningar" className="head-hover orders-link">
            <small>Returer</small>
            <strong>& beställningar</strong>
          </Link>
          <Link href="/varukorg" className="cart-link head-hover">
            <span className="cart-icon">
              <ShoppingCart size={32} />
              <b>{data?.cart.reduce((n, l) => n + l.quantity, 0) || 0}</b>
            </span>
            <strong>Varukorg</strong>
          </Link>
        </div>
        <nav className="header-nav" aria-label="Huvudnavigation">
          <button onClick={() => setMenu(true)}>
            <Menu size={20} />
            Alla kategorier
          </button>
          <Link href="/sok?deals=1">Dagens erbjudanden</Link>
          <Link href="/sok?sort=popular">Bästsäljare</Link>
          <Link href="/sok?sort=new">Nyheter</Link>
          <Link href="/medlemskap">Nordmark Plus</Link>
          <Link href="/presentkort">Presentkort</Link>
          <Link href="/saljare">Sälj på Nordmark</Link>
          <Link href="/hjalp">Kundservice</Link>
          <span className="nav-right">Små upptäckter. Stora möjligheter.</span>
        </nav>
      </header>
      <Dialog.Root open={menu} onOpenChange={setMenu}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="drawer">
            <div className="drawer-heading">
              <User />
              <Dialog.Title>Hej, välkommen in</Dialog.Title>
              <Dialog.Close aria-label="Stäng meny">
                <X />
              </Dialog.Close>
            </div>
            <div className="drawer-scroll">
              <h3>Populärt just nu</h3>
              <Link onClick={() => setMenu(false)} href="/sok?deals=1">
                Dagens erbjudanden <ArrowRight size={18} />
              </Link>
              <Link onClick={() => setMenu(false)} href="/sok?sort=popular">
                Bästsäljare <ArrowRight size={18} />
              </Link>
              <hr />
              <h3>Handla efter kategori</h3>
              {categories.map((c) => (
                <Link key={c.id} onClick={() => setMenu(false)} href={`/sok?category=${c.id}`}>
                  {c.name}
                  <ArrowRight size={16} />
                </Link>
              ))}
              <hr />
              <h3>Hjälp & inställningar</h3>
              <Link href="/konto" onClick={() => setMenu(false)}>
                <User size={18} />
                Ditt konto
              </Link>
              <Link href="/onskelistor" onClick={() => setMenu(false)}>
                <Heart size={18} />
                Dina listor
              </Link>
              <Link href="/bestallningar" onClick={() => setMenu(false)}>
                <Package size={18} />
                Dina beställningar
              </Link>
              <Link href="/hjalp" onClick={() => setMenu(false)}>
                <Headphones size={18} />
                Kundservice
              </Link>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={location} onOpenChange={setLocation}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="modal">
            <Dialog.Title>Välj leveransplats</Dialog.Title>
            <Dialog.Description>
              Se leveransinformation för ditt område. Alla leveranser i butiken är simulerade.
            </Dialog.Description>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await run('settings', { settings: { postcode } });
                setLocation(false);
                router.refresh();
              }}
            >
              <label>
                Postnummer
                <input
                  value={postcode}
                  pattern="[0-9]{3} ?[0-9]{2}"
                  required
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </label>
              <button className="btn yellow">Använd postnummer</button>
            </form>
            <Dialog.Close className="modal-close" aria-label="Stäng">
              <X />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {data?.settings.banner && (
        <div className="campaign-message">{String(data.settings.banner)}</div>
      )}
      <div className="demo-strip">
        <span>DEMO BUTIK</span>Upptäck, handla och testa – inga riktiga betalningar.
        <Link href="/demo">
          Prova kund, säljare & admin <ArrowRight size={12} />
        </Link>
      </div>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        Till toppen ↑
      </button>
      <div className="footer-columns">
        <section>
          <h3>Lär känna Nordmark</h3>
          <Link href="/om">Om oss</Link>
          <Link href="/hjalp">Så fungerar det</Link>
          <Link href="/saljare">Våra säljare</Link>
          <Link href="/hallbarhet">Ett mer medvetet val</Link>
        </section>
        <section>
          <h3>Gör affärer med oss</h3>
          <Link href="/saljare">Börja sälja på Nordmark</Link>
          <Link href="/portal">Säljarportalen</Link>
          <Link href="/admin">Administration</Link>
          <Link href="/demo">Utforska demoläget</Link>
        </section>
        <section>
          <h3>Mer för dina pengar</h3>
          <Link href="/sok?deals=1">Dagens erbjudanden</Link>
          <Link href="/medlemskap">Nordmark Plus</Link>
          <Link href="/presentkort">Presentkort & saldo</Link>
          <Link href="/onskelistor">Önskelistor</Link>
        </section>
        <section>
          <h3>Vi hjälper dig</h3>
          <Link href="/konto">Ditt konto</Link>
          <Link href="/bestallningar">Dina beställningar</Link>
          <Link href="/hjalp">Leverans & returer</Link>
          <Link href="/hjalp">Kontakta kundservice</Link>
        </section>
      </div>
      <div className="footer-bottom">
        <Link href="/" className="logo">
          nordmark
          <span />
        </Link>
        <span>🇸🇪 Sverige · Svenska · SEK</span>
        <div>
          <Link href="/villkor">Villkor</Link>
          <Link href="/integritet">Integritet</Link>
          <span>© {new Date().getFullYear()} Nordmark · En demonstrationsbutik</span>
        </div>
      </div>
    </footer>
  );
}
