import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const { token }      = useParams()
  const { verifyEmail } = useAuth()

  const [status, setStatus]   = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found.')
      return
    }
    verifyEmail(token)
      .then(result => {
        setStatus('success')
        setMessage(result.message)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__brand">💪 GymFit</Link>

          {status === 'loading' && (
            <>
              <div className="auth-loading__spinner" style={{ margin: '16px auto' }} />
              <h1 className="auth-card__title">Verifying...</h1>
              <p className="auth-card__subtitle">Please wait while we verify your email.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="auth-success-icon">✓</div>
              <h1 className="auth-card__title">Email Verified!</h1>
              <p className="auth-card__subtitle">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="auth-error-icon">✗</div>
              <h1 className="auth-card__title">Verification Failed</h1>
              <p className="auth-card__subtitle">{message}</p>
            </>
          )}
        </div>

        {status !== 'loading' && (
          <div style={{ padding: '0 32px 32px' }}>
            <Link
              to={status === 'success' ? '/login' : '/register'}
              className="auth-form__btn"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              {status === 'success' ? 'Go to Login' : 'Back to Register'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
