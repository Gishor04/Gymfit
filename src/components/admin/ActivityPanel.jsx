import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../../utils/apiFetch'

const CATEGORIES = ['all', 'post', 'profile', 'contact', 'auth']

const ACTION_META = {
  post_created:      { icon: '✏️',  color: '#22c55e', label: 'Post Created'      },
  post_updated:      { icon: '📝',  color: '#3b82f6', label: 'Post Updated'      },
  post_deleted:      { icon: '🗑️', color: '#ef4444', label: 'Post Deleted'      },
  post_admin_edited: { icon: '🔧',  color: '#f59e0b', label: 'Admin Edited Post' },
  post_admin_deleted:{ icon: '🗑️', color: '#ef4444', label: 'Admin Deleted Post'},
  profile_updated:   { icon: '👤',  color: '#8b5cf6', label: 'Profile Updated'   },
  contact_sent:      { icon: '📧',  color: '#06b6d4', label: 'Message Sent'      },
  member_registered: { icon: '🎉',  color: '#f5a623', label: 'New Registration'  },
}

const fmt     = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

export default function ActivityPanel() {
  const [logs,     setLogs]    = useState([])
  const [loading,  setLoading] = useState(true)
  const [category, setCat]     = useState('all')
  const [page,     setPage]    = useState(1)
  const [total,    setTotal]   = useState(0)
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: LIMIT, page })
      if (category !== 'all') params.set('category', category)
      const r = await apiFetch(`/api/admin/activity?${params}`)
      const d = await r.json()
      setLogs(d.data   || [])
      setTotal(d.total || 0)
    } catch { setLogs([]) }
    finally { setLoading(false) }
  }, [category, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  const getMeta = (action) => ACTION_META[action] || { icon: '📋', color: '#6b7280', label: action }

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Activity Log</h1>
          <p className="admin__subtitle">{total} events recorded across all member actions</p>
        </div>
        <button className="admin__btn admin__btn--ghost admin__btn--sm" onClick={() => { setPage(1); load() }}>
          ↻ Refresh
        </button>
      </div>

      {/* Category filter */}
      <div className="admin__toolbar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`admin__btn admin__btn--sm${category === c ? ' admin__btn--primary' : ' admin__btn--ghost'}`}
              onClick={() => { setCat(c); setPage(1) }}
            >
              {c === 'all'     ? '📋 All'          :
               c === 'post'    ? '✏️ Posts'        :
               c === 'profile' ? '👤 Profiles'     :
               c === 'contact' ? '📧 Messages'     :
               c === 'auth'    ? '🔑 Auth'         : c}
            </button>
          ))}
        </div>
      </div>

      {/* Activity stats strip */}
      <div className="admin__stats" style={{ marginBottom: 20 }}>
        {Object.entries(ACTION_META).slice(0, 4).map(([key, meta]) => {
          const count = logs.filter(l => l.action === key).length
          return (
            <div key={key} className="admin__stat-card">
              <div className="admin__stat-icon" style={{ background: meta.color + '22' }}>{meta.icon}</div>
              <div>
                <div className="admin__stat-num" style={{ color: meta.color }}>{count}</div>
                <div className="admin__stat-label">{meta.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Activity feed */}
      <div className="admin__card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin__empty"><div className="admin__empty-icon">⏳</div></div>
        ) : !logs.length ? (
          <div className="admin__empty">
            <div className="admin__empty-icon">📋</div>
            <div className="admin__empty-text">No activity recorded yet. Member actions will appear here automatically.</div>
          </div>
        ) : (
          <div className="activity-feed">
            {logs.map((log, i) => {
              const meta = getMeta(log.action)
              return (
                <div key={log.id || i} className="activity-item">
                  <div className="activity-item__icon" style={{ background: meta.color + '18', color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="activity-item__body">
                    <div className="activity-item__desc">{log.description || meta.label}</div>
                    <div className="activity-item__meta">
                      <span className="activity-item__badge" style={{ background: meta.color + '18', color: meta.color }}>
                        {meta.label}
                      </span>
                      {log.userEmail && (
                        <span style={{ fontSize: '0.78rem', color: '#888' }}>{log.userEmail}</span>
                      )}
                      {log.metadata?.postId && (
                        <span style={{ fontSize: '0.75rem', color: '#bbb' }}>post:{log.metadata.postId.slice(-6)}</span>
                      )}
                    </div>
                  </div>
                  <div className="activity-item__time">
                    <div>{fmt(log.createdAt)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{fmtTime(log.createdAt)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="admin__btn admin__btn--ghost admin__btn--sm"
            disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#555' }}>
            Page {page} of {totalPages}
          </span>
          <button className="admin__btn admin__btn--ghost admin__btn--sm"
            disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
