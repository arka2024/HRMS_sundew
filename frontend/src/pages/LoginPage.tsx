import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { ApiClientError } from '../services/api.client';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <AuthLayout>
      <div className="login-header">
        <span className="brand-mark large">S</span>
        <h1>Sundew HRMS</h1>
        <p>Sign in to access your workspace</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hr@sundew.com"
          required
          autoComplete="username"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />

        <button type="submit" className="btn btn-primary full-width" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="demo-credentials">
        <p>Demo accounts</p>
        <ul>
          <li>HR: hr@sundew.com / password123</li>
          <li>Manager: manager@sundew.com / password123</li>
        </ul>
      </div>
    </AuthLayout>
  );
}
