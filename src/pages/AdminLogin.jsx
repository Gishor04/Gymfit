import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const { adminLogin, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  if (user?.role === 'admin') {
    navigate('/admin', { replace: true })
    return null
  }

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(form.email, form.password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-page--dark">
      <div className="auth-card auth-card--admin">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__brand">💪 GymFit</Link>
          <div className="auth-admin-badge">Admin Access</div>
          <h1 className="auth-card__title">Admin Login</h1>
          <p className="auth-card__subtitle">Restricted area — authorized personnel only.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="auth-alert auth-alert--error">{error}</div>}

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="email">Admin Email</label>
            <input
              id="email"
              type="email"
              className="auth-form__input"
              value={form.email}
              onChange={set('email')}
              placeholder="admin@gymfit.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="auth-form__input"
              value={form.password}
              onChange={set('password')}
              placeholder="Admin password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-form__btn auth-form__btn--admin" disabled={loading}>
            {loading ? <><span className="spinner" /> Authenticating...</> : 'Login to Admin Panel'}
          </button>
        </form>

        <div className="auth-card__footer">
          <Link to="/" className="auth-form__link--muted">← Back to Website</Link>
        </div>
      </div>
    </div>
  )
}
