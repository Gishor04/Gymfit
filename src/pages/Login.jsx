import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__brand">💪 GymFit</Link>
          <h1 className="auth-card__title">Member Login</h1>
          <p className="auth-card__subtitle">Welcome back! Sign in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="auth-alert auth-alert--error">{error}</div>}

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="auth-form__input"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form__group">
            <div className="auth-form__label-row">
              <label className="auth-form__label" htmlFor="password">Password</label>
              <Link to="/forgot-password" className="auth-form__link--small">Forgot password?</Link>
            </div>
            <input
              id="password"
              type="password"
              className="auth-form__input"
              value={form.password}
              onChange={set('password')}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-form__btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-card__footer">
          <span>Don't have an account?</span>
          <Link to="/register" className="auth-form__link">Create one</Link>
        </div>

        <div className="auth-card__divider">
          <span>Admin?</span>
        </div>
        <div className="auth-card__footer">
          <Link to="/admin-login" className="auth-form__link--muted">Admin login →</Link>
        </div>
      </div>
    </div>
  )
}
