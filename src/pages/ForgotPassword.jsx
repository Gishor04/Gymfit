import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()

  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email.trim()) return setError('Email is required.')
    setLoading(true)
    try {
      const result = await forgotPassword(email)
      setSuccess(result.message)
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
          <h1 className="auth-card__title">Forgot Password</h1>
          <p className="auth-card__subtitle">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error   && <div className="auth-alert auth-alert--error">{error}</div>}
          {success && <div className="auth-alert auth-alert--success">{success}</div>}

          {!success && (
            <>
              <div className="auth-form__group">
                <label className="auth-form__label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="auth-form__input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" className="auth-form__btn" disabled={loading}>
                {loading ? <><span className="spinner" /> Sending...</> : 'Send Reset Link'}
              </button>
            </>
          )}
        </form>

        <div className="auth-card__footer">
          <span>Remember your password?</span>
          <Link to="/login" className="auth-form__link">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
