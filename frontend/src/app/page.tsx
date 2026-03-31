import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="landing-hero">
        <div className="landing-panel">
          <span className="landing-kicker">Small Full-Stack Booking System</span>
          <h1 className="landing-title">Reserve concert seats without chaos.</h1>
          <p className="landing-copy">
            This assignment build includes a Next.js frontend, a NestJS backend,
            PostgreSQL-ready infrastructure, responsive admin and user flows, and
            concurrency-aware reservation logic.
          </p>
          <div className="landing-actions">
            <Link className="base-button button-primary" href="/login">
              Open dashboard
            </Link>
            <Link className="base-button button-muted" href="/register">
              Create user account
            </Link>
          </div>
          <div className="landing-grid">
            <article className="landing-card">
              <h2>Included in this delivery</h2>
              <div className="landing-list">
                <p>Admin can create and delete concerts, inspect aggregate seat metrics, and view reservation history.</p>
                <p>User can browse all concerts, reserve one seat per concert, cancel reservations, and review their own history.</p>
                <p>The backend is designed for PostgreSQL with migrations, Docker support, and unit tests around critical services.</p>
              </div>
            </article>
            <article className="landing-card">
              <h3>Demo accounts</h3>
              <div className="landing-list">
                <p><strong>Admin:</strong> admin / admin123</p>
                <p><strong>User:</strong> sarajohn / user1234</p>
                <p>Or create a fresh user from the register page.</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
