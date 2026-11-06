import Link from 'next/link';
import { catalogForRequest } from '@/lib/server-catalog';
import { categories, products, sellers, searchProducts } from '@/lib/catalog';
import { ProductCard } from './product-card';
export async function SearchPage({ params }: { params: Record<string, string | undefined> }) {
  const results = searchProducts(params, await catalogForRequest());
  const page = Math.max(1, Math.min(Math.ceil(results.length / 20) || 1, Number(params.page) || 1));
  const title = params.q
    ? `Resultat för ”${params.q}”`
    : params.category
      ? categories.find((c) => c.id === params.category)?.name
      : params.deals
        ? 'Dagens erbjudanden'
        : 'Alla upptäckter';
  const pageUrl = (n: number) =>
    `/sok?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v) as [string, string][]), page: String(n) })}`;
  return (
    <div className="search-page">
      <div className="results-summary">
        <span>
          <Link href="/">Hem</Link> / {title}
        </span>
        <span>
          <b>{results.length}</b> resultat ·{' '}
          {results.length ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, results.length)}` : '0'}
        </span>
      </div>
      <div className="search-layout">
        <details className="filters" open>
          <summary>Filter & sortering</summary>
          <form action="/sok">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            <div className="filter-title">
              <h3>Förfina din sökning</h3>
              <Link href="/sok">Rensa</Link>
            </div>
            <label>
              Sortera efter
              <select name="sort" defaultValue={params.sort || ''}>
                <option value="">Relevans</option>
                <option value="price-asc">Pris: lågt till högt</option>
                <option value="price-desc">Pris: högt till lågt</option>
                <option value="popular">Mest populära</option>
                <option value="rating">Högsta betyg</option>
                <option value="new">Nyheter</option>
              </select>
            </label>
            <label>
              Kategori
              <select name="category" defaultValue={params.category || ''}>
                <option value="">Alla kategorier</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Varumärke
              <select name="brand" defaultValue={params.brand || ''}>
                <option value="">Alla varumärken</option>
                {[...new Set(products.map((p) => p.brand))].sort().map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label>
              Säljare
              <select name="seller" defaultValue={params.seller || ''}>
                <option value="">Alla säljare</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Pris (kr)</legend>
              <div className="price-filter">
                <input
                  name="min"
                  type="number"
                  min="0"
                  placeholder="Från"
                  aria-label="Lägsta pris"
                  defaultValue={params.min}
                />
                <span>–</span>
                <input
                  name="max"
                  type="number"
                  min="0"
                  placeholder="Till"
                  aria-label="Högsta pris"
                  defaultValue={params.max}
                />
              </div>
            </fieldset>
            <label>
              Kundbetyg
              <select name="rating" defaultValue={params.rating || ''}>
                <option value="">Alla betyg</option>
                <option value="4">★★★★☆ & uppåt</option>
                <option value="4.5">4,5 & uppåt</option>
                <option value="4.8">4,8 & uppåt</option>
              </select>
            </label>
            <label className="check">
              <input name="stock" type="checkbox" value="1" defaultChecked={!!params.stock} />
              Endast i lager
            </label>
            <label className="check">
              <input name="deals" type="checkbox" value="1" defaultChecked={!!params.deals} />
              Minst 20 % rabatt
            </label>
            <button className="btn yellow">Visa resultat</button>
          </form>
        </details>
        <section className="results">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HITTA DIN NÄSTA FAVORIT</p>
              <h1>{title}</h1>
            </div>
          </div>
          {results.length ? (
            <>
              <div className="results-grid">
                {results.slice((page - 1) * 20, page * 20).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <nav className="pagination" aria-label="Sidor">
                {Array.from({ length: Math.ceil(results.length / 20) }, (_, i) => (
                  <Link
                    key={i}
                    className={page === i + 1 ? 'current' : ''}
                    href={pageUrl(i + 1)}
                    aria-current={page === i + 1 ? 'page' : undefined}
                  >
                    {i + 1}
                  </Link>
                ))}
              </nav>
            </>
          ) : (
            <div className="empty">
              <SearchIllustration />
              <h2>Ingen träff den här gången</h2>
              <p>Prova ett kortare sökord eller välj färre filter.</p>
              <Link className="btn yellow" href="/sok">
                Utforska alla produkter
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
function SearchIllustration() {
  return <span className="empty-icon">⌕</span>;
}
