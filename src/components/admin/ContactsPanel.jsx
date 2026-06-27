import { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/apiFetch'

export default function ContactsPanel() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    apiFetch('/api/admin/contacts')
      .then(r => r.json())
      .then(d => { setContacts(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Contact Messages</h1>
          <p className="admin__subtitle">{contacts.length} messages received</p>
        </div>
      </div>

      <div className="admin__toolbar">
        <input
          className="admin__search"
          placeholder="Search by name, email or message…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="admin__card">
        {loading ? (
          <div className="admin__empty"><div className="admin__empty-icon">⏳</div></div>
        ) : filtered.length === 0 ? (
          <div className="admin__empty">
            <div className="admin__empty-icon">📭</div>
            <div className="admin__empty-text">
              {contacts.length === 0 ? 'No contact messages yet.' : 'No messages match your search.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Phone</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#111' }}>{c.name}</div>
                      <a href={`mailto:${c.email}`} style={{ fontSize: '0.8rem', color: '#3b82f6' }}>{c.email}</a>
                    </td>
                    <td style={{ color: '#555' }}>{c.phone || '—'}</td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontSize: '0.88rem', color: '#444', overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {c.message}
                      </div>
                    </td>
                    <td style={{ color: '#888', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {new Date(c.createdAt).toLocaleDateString()}<br />
                      <span style={{ color: '#bbb' }}>{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td>
                      <button
                        className="admin__btn admin__btn--ghost admin__btn--sm"
                        onClick={() => setSelected(c)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full message modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">Message from {selected.name}</h2>
              <button className="modal__close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: '0.8rem', color: '#888', minWidth: 60 }}>From</span>
                <span style={{ fontWeight: 600 }}>{selected.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: '0.8rem', color: '#888', minWidth: 60 }}>Email</span>
                <a href={`mailto:${selected.email}`} style={{ color: '#3b82f6' }}>{selected.email}</a>
              </div>
              {selected.phone && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: '0.8rem', color: '#888', minWidth: 60 }}>Phone</span>
                  <span>{selected.phone}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: '0.8rem', color: '#888', minWidth: 60 }}>Date</span>
                <span>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 8, padding: '16px', background: '#f9f9f9', borderRadius: 8, lineHeight: 1.7, color: '#333', fontSize: '0.95rem' }}>
                {selected.message}
              </div>
            </div>
            <div className="modal__actions">
              <button className="admin__btn admin__btn--ghost" onClick={() => setSelected(null)}>Close</button>
              <a href={`mailto:${selected.email}?subject=Re: Your GymFit Enquiry`}
                className="admin__btn admin__btn--primary"
                style={{ textDecoration: 'none' }}>
                ✉ Reply by Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
