import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const strength = (pwd) => {
    if (!pwd) return 0
    let s = 0
    if (pwd.length >= 8)   s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthClass = ['', 'weak', 'fair', 'good', 'strong']
  const pwd = form.password
  const pwdStrength = strength(pwd)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim())  return setError('Name is required.')
    if (!form.email.trim()) return setError('Email is required.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const result = await register(form.name, form.email, form.password)
      setSuccess(result.message)
      setForm({ name: '', email: '', password: '', confirm: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <Link to="/" className="auth-card__brand">💪 GymFit</Link>
            <div className="auth-success-icon">✓</div>
            <h1 className="auth-card__title">Account Created!</h1>
            <p className="auth-card__subtitle">{success}</p>
          </div>
          <div style={{ padding: '0 32px 32px' }}>
            <Link to="/login" className="auth-form__btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__brand">💪 GymFit</Link>
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Join GymFit and start your fitness journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="auth-alert auth-alert--error">{error}</div>}

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="auth-form__input"
              value={form.name}
              onChange={set('name')}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </div>

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
            <label className="auth-form__label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="auth-form__input"
              value={form.password}
              onChange={set('password')}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
            {pwd && (
              <div className="auth-strength">
                <div className={`auth-strength__bar auth-strength__bar--${strengthClass[pwdStrength]}`}>
                  <div className="auth-strength__fill" style={{ width: `${pwdStrength * 25}%` }} />
                </div>
                <span className={`auth-strength__label auth-strength__label--${strengthClass[pwdStrength]}`}>
                  {strengthLabel[pwdStrength]}
                </span>
              </div>
            )}
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              className="auth-form__input"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="auth-form__btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
          </button>

          <p className="auth-form__terms">
            By creating an account you agree to our terms of service.
          </p>
        </form>

        <div className="auth-card__footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-form__link">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
