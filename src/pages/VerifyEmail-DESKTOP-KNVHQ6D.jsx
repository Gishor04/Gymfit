import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiFetch from '../utils/apiFetch';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await apiFetch(`/api/auth/verify-email/${token}`);
        setMessage(data.message);
        setStatus('success');
      } catch (err) {
        setMessage(err.message || 'Verification failed. The link may have expired.');
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  if (status === 'loading') {
    return (
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card auth-card--center">
            <div className="auth-spinner" />
            <p className="auth-subtitle">Verifying your email address...</p>
          </div>
        </div>
      </section>
    );
  }

  if (status === 'success') {
    return (
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card auth-card--success">
            <div className="auth-success-icon">✓</div>
            <h2 className="auth-title">Email Verified!</h2>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="btn btn-primary auth-submit">Sign In Now</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-card auth-card--error">
          <div className="auth-error-icon">✗</div>
          <h2 className="auth-title">Verification Failed</h2>
          <p className="auth-subtitle">{message}</p>
          <div className="auth-actions">
            <Link to="/login" className="btn btn-primary auth-submit">Go to Login</Link>
          </div>
          <div className="auth-footer">
            <p>Need a new verification link?{' '}
              <Link to="/register" className="auth-link">Register again</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;
