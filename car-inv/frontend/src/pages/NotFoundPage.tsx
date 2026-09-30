import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <p className="section-eyebrow">404 · Not found</p>
      <h1 className="section-title">That page took a wrong turn.</h1>
      <Link className="primary-button mt-8" to="/inventory">
        Browse available cars
      </Link>
    </main>
  );
}
