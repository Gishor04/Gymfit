import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiFetch from '../utils/apiFetch';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setMessage('Please enter your email address.'); setStatus('error'); return; }
    setStatus('loading');
    try {
      const data = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(data.message);
      setStatus('sent');
    } catch (err) {
      setMessage(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card auth-card--success">
            <div className="auth-success-icon">✉</div>
            <h2 className="auth-title">Check Your Email</h2>
            <p className="auth-subtitle">{message}</p>
            <p className="auth-subtitle">The reset link expires in 1 hour.</p>
            <Link to="/login" className="btn btn-primary auth-submit">Back to Login</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Forgot Password</h1>
            <p className="auth-subtitle">
              Enter the email address linked to your account and we will send you a reset link.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {status === 'error' && (
              <div className="auth-alert auth-alert--error">{message}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
