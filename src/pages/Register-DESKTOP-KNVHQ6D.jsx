import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/apiFetch';

const plans = [
  { value: 'Basic', label: 'Basic – $29/mo' },
  { value: 'Pro', label: 'Pro – $59/mo (Most Popular)' },
  { value: 'Elite', label: 'Elite – $99/mo' },
];

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    membershipPlan: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const { message } = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          membershipPlan: form.membershipPlan || null,
          password: form.password,
        }),
      });
      setSuccess(message);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card auth-card--success">
            <div className="auth-success-icon">✓</div>
            <h2 className="auth-title">Check Your Email</h2>
            <p className="auth-subtitle">{success}</p>
            <p className="auth-subtitle">Click the verification link in your email to activate your account.</p>
            <button className="btn btn-primary auth-submit" onClick={() => navigate('/login')}>
              Go to Login
            </button>
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
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join GymFit and start your fitness journey today.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="auth-alert auth-alert--error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="John Smith"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number (optional)</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-control"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="membershipPlan">Membership Plan (optional)</label>
              <select
                id="membershipPlan"
                name="membershipPlan"
                className="form-control"
                value={form.membershipPlan}
                onChange={handleChange}
              >
                <option value="">Select a plan</option>
                {plans.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
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
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-control"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
