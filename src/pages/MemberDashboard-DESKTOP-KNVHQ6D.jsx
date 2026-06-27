import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../utils/apiFetch';

const MemberDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const data = await apiFetch('/api/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify({ name: editForm.name, phone: editForm.phone }),
      });
      updateUser(data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return;
    }
    setSaving(true);
    setPwMsg({ type: '', text: '' });
    try {
      const data = await apiFetch('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      setPwMsg({ type: 'success', text: data.message });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Password change failed.' });
    } finally {
      setSaving(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'N/A';

  return (
    <section className="dashboard-section">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-welcome">
            <h1 className="dashboard-title">Welcome, {user?.name}!</h1>
            <p className="dashboard-subtitle">Manage your GymFit membership and profile.</p>
          </div>
          <button className="btn btn-outline dashboard-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        <div className="dashboard-tabs">
          {['overview', 'profile', 'security'].map((tab) => (
            <button
              key={tab}
              className={`dashboard-tab${activeTab === tab ? ' dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3 className="card-label">Membership Plan</h3>
              <p className="card-value">{user?.membershipPlan || 'No plan selected'}</p>
            </div>
            <div className="dashboard-card">
              <h3 className="card-label">Member Since</h3>
              <p className="card-value">{memberSince}</p>
            </div>
            <div className="dashboard-card">
              <h3 className="card-label">Email Status</h3>
              <p className="card-value">
                {user?.isEmailVerified ? (
                  <span className="badge badge--success">Verified</span>
                ) : (
                  <span className="badge badge--warning">Pending</span>
                )}
              </p>
            </div>
            <div className="dashboard-card">
              <h3 className="card-label">Account Role</h3>
              <p className="card-value">
                <span className="badge badge--info">{user?.role}</span>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="dashboard-panel">
            <h2 className="panel-title">Edit Profile</h2>
            {profileMsg.text && (
              <div className={`auth-alert auth-alert--${profileMsg.type}`}>{profileMsg.text}</div>
            )}
            <form className="auth-form" onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  className="form-control"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  className="form-control"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <small className="form-hint">Email cannot be changed.</small>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  className="form-control"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="dashboard-panel">
            <h2 className="panel-title">Change Password</h2>
            {pwMsg.text && (
              <div className={`auth-alert auth-alert--${pwMsg.type}`}>{pwMsg.text}</div>
            )}
            <form className="auth-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label" htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  className="form-control"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="Your current password"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default MemberDashboard;
