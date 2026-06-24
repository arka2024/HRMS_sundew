import { LoginScene } from '../components/login/LoginScene';
import '../styles/login.css';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <section className="auth-brand-panel">
        <LoginScene />
        <div className="auth-brand-content">
          <img src="/sundew-logo.png" alt="Sundew" className="auth-brand-logo" />
          <h1>
            Sundew <span className="elevate-accent">Elevate</span>
          </h1>
          <p className="auth-brand-copy">
            Empower your workforce with our enterprise-grade management platform. Designed for
            precision, built for reliability.
          </p>
          <div className="auth-brand-visual">
            <img
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=85&w=1200"
              alt="Modern corporate workspace"
              loading="lazy"
            />
          </div>
          <div className="auth-brand-stats">
            <div className="auth-brand-stat">
              <strong>2.4k+</strong>
              <span>Organizations</span>
            </div>
            <div className="auth-brand-stat">
              <strong>99.9%</strong>
              <span>Uptime SLA</span>
            </div>
            <div className="auth-brand-stat">
              <strong>ISO</strong>
              <span>Certified</span>
            </div>
          </div>
        </div>
      </section>

      <div className="auth-form-panel">
        <div className="auth-card">{children}</div>
        <footer className="auth-page-footer">
          <span className="auth-page-footer-brand">Sundew Elevate</span>
          <div className="auth-page-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </div>
          <span>© 2026 Sundew Elevate. All rights reserved.</span>
        </footer>
      </div>
    </div>
  );
}
