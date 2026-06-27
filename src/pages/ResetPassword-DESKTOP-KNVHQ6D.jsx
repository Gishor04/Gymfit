import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/apiFetch';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setStatus('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || !form.confirmPassword) {
      setMessage('Both fields are required.'); setStatus('error'); return;
    }
    if (form.password.length < 8) {
      setMessage('Password must be at least 8 characters.'); setStatus('error'); return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.'); setStatus('error'); return;
    }
    setStatus('loading');
    try {
      const data = await apiFetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password: form.password, confirmPassword: form.confirmPassword }),
      });
      setMessage(data.message);
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setMessage(err.message || 'Reset failed. The link may have expired.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card auth-card--success">
            <div className="auth-success-icon">✓</div>
            <h2 className="auth-title">Password Reset!</h2>
            <p className="auth-subtitle">{message}</p>
            <p className="auth-subtitle">Redirecting to login in 3 seconds...</p>
            <Link to="/login" className="btn btn-primary auth-submit">Go to Login</Link>
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
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">Choose a strong new password for your account.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {status === 'error' && (
              <div className="auth-alert auth-alert--error">{message}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="password">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-control"
                placeholder="Repeat new password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/login" className="auth-link">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
