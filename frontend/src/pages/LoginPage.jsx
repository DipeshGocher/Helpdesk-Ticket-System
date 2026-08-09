import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/apiError';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import styles from './AuthPages.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login({ email: email.trim(), password, role });
      navigate('/', { replace: true });
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.card}`}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Log in to Appzeto Helpdesk</p>
        </div>

        <div className={styles.roleTabs}>
          <button
            type="button"
            className={`${styles.roleTab} ${role === 'customer' ? styles.roleTabActive : ''}`}
            onClick={() => setRole('customer')}
          >
            I&rsquo;m a Customer
          </button>
          <button
            type="button"
            className={`${styles.roleTab} ${role === 'agent' ? styles.roleTabActive : ''}`}
            onClick={() => setRole('agent')}
          >
            I&rsquo;m an Agent
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner inline size={16} label="" /> : 'Log in'}
          </button>
        </form>

        {role === 'agent' ? (
          <p className={styles.seededHint}>
            Seeded agents: riya@appzeto.com / karan@appzeto.com / dev@appzeto.com
            <br />
            Password: Agent@123
          </p>
        ) : (
          <p className={styles.footerText}>
            New here? <Link to="/register">Create a customer account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
