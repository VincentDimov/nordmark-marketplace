import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="content-page empty white-section">
      <span className="empty-icon">404</span>
      <h1>Här fanns visst ingen upptäckt</h1>
      <p>Sidan kan ha flyttats. Det finns fler favoriter att hitta.</p>
      <Link className="btn yellow" href="/">
        Till startsidan
      </Link>
    </div>
  );
}
