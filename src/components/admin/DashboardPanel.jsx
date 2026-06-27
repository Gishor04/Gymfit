import { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/apiFetch'

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

const ACTION_ICONS = {
  post_created:       '✏️',
  post_updated:       '📝',
  post_deleted:       '🗑️',
  post_admin_edited:  '🔧',
  post_admin_deleted: '🗑️',
  profile_updated:    '👤',
  contact_sent:       '📧',
  member_registered:  '🎉',
}

export default function DashboardPanel() {
  const [stats,   setStats]   = useState(null)
  const [recent,  setRecent]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/stats').then(r => r.json()),
      apiFetch('/api/members').then(r => r.json()),
    ]).then(([s, m]) => {
      if (s.success) setStats(s.data)
      const members = m.data || []
      setRecent([...members].reverse().slice(0, 5))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="admin__empty">
      <div className="admin__empty-icon">⏳</div>
      <div className="admin__empty-text">Loading dashboard…</div>
    </div>
  )

  const CARDS = [
    { icon: '👥', label: 'Registered Users',  value: stats?.registeredUsers ?? 0, bg: '#fff7ed', color: '#f5a623' },
    { icon: '✅', label: 'Admin Members',      value: stats?.members         ?? 0, bg: '#f0fdf4', color: '#22c55e' },
    { icon: '✏️', label: 'Member Posts',       value: stats?.memberPosts     ?? 0, bg: '#fdf4ff', color: '#8b5cf6' },
    { icon: '📝', label: 'Published Posts',    value: stats?.adminPosts      ?? 0, bg: '#eff6ff', color: '#3b82f6' },
    { icon: '📧', label: 'Contact Messages',   value: stats?.contacts        ?? 0, bg: '#f0fdf9', color: '#06b6d4' },
  ]

  const recentActivity = stats?.recentActivity || []

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Dashboard</h1>
          <p className="admin__subtitle">Welcome back to GymFit Admin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin__stats">
        {CARDS.map(c => (
          <div key={c.label} className="admin__stat-card">
            <div className="admin__stat-icon" style={{ background: c.bg }}>{c.icon}</div>
            <div>
              <div className="admin__stat-num" style={{ color: c.color }}>{c.value}</div>
              <div className="admin__stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {/* Recent Members */}
        <div className="admin__card">
          <div style={{ padding: '18px 20px 0', fontWeight: 700, color: '#111', fontSize: '0.95rem', marginBottom: 4 }}>
            Recent Members
          </div>
          {recent.length === 0 ? (
            <div className="admin__empty">
              <div className="admin__empty-icon">👋</div>
              <div className="admin__empty-text">No members yet.</div>
            </div>
          ) : (
            <table className="admin__table">
              <thead>
                <tr><th>Member</th><th>Plan</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {recent.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="admin__member-name">
                        <div className="admin__avatar">{m.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#888' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge--${m.membershipPlan?.toLowerCase()}`}>{m.membershipPlan}</span></td>
                    <td style={{ color: '#888', fontSize: '0.82rem' }}>{fmt(m.joinDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Activity */}
        <div className="admin__card">
          <div style={{ padding: '18px 20px 12px', fontWeight: 700, color: '#111', fontSize: '0.95rem' }}>
            Recent Activity
          </div>
          {recentActivity.length === 0 ? (
            <div className="admin__empty">
              <div className="admin__empty-icon">📋</div>
              <div className="admin__empty-text">No activity yet — member actions appear here.</div>
            </div>
          ) : (
            <div style={{ padding: '0 0 8px' }}>
              {recentActivity.map((log, i) => (
                <div key={log.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 20px', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>
                    {ACTION_ICONS[log.action] || '📋'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.83rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.description}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#bbb', marginTop: 2 }}>
                      {fmt(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
