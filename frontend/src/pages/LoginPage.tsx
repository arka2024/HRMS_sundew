import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { ApiClientError } from '../services/api.client';
import { ROUTES } from '../constants';

type Portal = 'manager' | 'hr';

const DEMO_ACCOUNTS = [
  { role: 'HR Administrator', email: 'hr@sundew.com', portal: 'hr' as Portal },
  { role: 'Manager Access', email: 'manager@sundew.com', portal: 'manager' as Portal },
];

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="m4 8 8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}


function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M6.7 6.8C4.6 8.2 3 10.5 2 12c0 0 3.5 7 10 7 1.8 0 3.4-.4 4.8-1.1M17.3 17.3C19.4 15.9 21 13.6 22 12c0 0-1.5-3-4.5-5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<Portal>('manager');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const redirectPath = await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        console.error(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function fillDemoAccount(accountEmail: string, accountPortal: Portal) {
    setPortal(accountPortal);
    setEmail(accountEmail);
    setPassword('password123');
  }

  const submitLabel =
    portal === 'manager' ? 'Sign In to Manager Portal' : 'Sign In to HR Portal';

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="login-card-header">
          <h2>System Authentication</h2>
          <p>Select your portal to continue</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Portal selection">
          {(
            [
              { id: 'manager', label: 'Manager' },
              { id: 'hr', label: 'HR Administrator' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={portal === tab.id}
              className={`auth-tab${portal === tab.id ? ' active' : ''}`}
              onClick={() => setPortal(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <motion.div
            className="auth-tab-indicator"
            layoutId="auth-tab-indicator"
            style={{
              width: '50%',
              left: portal === 'manager' ? '0%' : '50%',
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        </div>

        <motion.form
          key={portal}
          className="login-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: portal === 'manager' ? -8 : 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="login-field">
            <label htmlFor="email">Corporate Email</label>
            <div className="input-wrap">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="username"
              />
              <span className="input-icon">
                <MailIcon />
              </span>
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Password
              <a href="#">Forgot password?</a>
            </label>
            <div className="input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon clickable"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
              />
              Remember this device
            </label>
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : submitLabel}
            {!isSubmitting && <ArrowIcon />}
          </button>
        </motion.form>

        <div className="demo-credentials">
          <p>Demo accounts</p>
          <div className="demo-credentials-grid">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-chip"
                onClick={() => fillDemoAccount(account.email, account.portal)}
              >
                <span className="demo-chip-role">{account.role}</span>
                <span className="demo-chip-email">{account.email}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="login-card-footer">
          <a href={ROUTES.REGISTER}>Create an account</a>
          <a href="#">Forgot password?</a>
          <a href="#">Contact Support</a>
          <span>© 2026 Sundew Elevate. All rights reserved.</span>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
