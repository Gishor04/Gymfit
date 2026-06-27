import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const { adminLogin, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && isAdmin) {
    navigate('/admin', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your admin credentials.');
      return;
    }
    setLoading(true);
    try {
      await adminLogin(form.email, form.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section auth-section--admin">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-badge">Admin Portal</div>
            <h1 className="auth-title">Admin Login</h1>
            <p className="auth-subtitle">Restricted access — authorized personnel only.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="auth-alert auth-alert--error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Admin Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="admin@gymfit.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="Enter admin password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/login" className="auth-link">Member Login</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;
