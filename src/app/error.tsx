'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="content-page empty white-section">
      <h1>Vi kunde inte ladda sidan</h1>
      <p>Försök igen om en liten stund.</p>
      <button className="btn yellow" onClick={reset}>
        Försök igen
      </button>
    </div>
  );
}
