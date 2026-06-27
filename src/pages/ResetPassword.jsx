import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const { token }      = useParams()
  const { resetPassword } = useAuth()
  const navigate       = useNavigate()

  const [form, setForm]       = useState({ password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const result = await resetPassword(token, form.password)
      setSuccess(result.message)
      setTimeout(() => navigate('/login'), 3000)
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
          <h1 className="auth-card__title">Reset Password</h1>
          <p className="auth-card__subtitle">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error   && <div className="auth-alert auth-alert--error">{error}</div>}
          {success && (
            <div className="auth-alert auth-alert--success">
              {success} Redirecting to login...
            </div>
          )}

          {!success && (
            <>
              <div className="auth-form__group">
                <label className="auth-form__label" htmlFor="password">New Password</label>
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
              </div>
              <div className="auth-form__group">
                <label className="auth-form__label" htmlFor="confirm">Confirm New Password</label>
                <input
                  id="confirm"
                  type="password"
                  className="auth-form__input"
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <button type="submit" className="auth-form__btn" disabled={loading}>
                {loading ? <><span className="spinner" /> Resetting...</> : 'Reset Password'}
              </button>
            </>
          )}
        </form>

        <div className="auth-card__footer">
          <Link to="/login" className="auth-form__link--muted">← Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
