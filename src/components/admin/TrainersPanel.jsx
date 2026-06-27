import { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/apiFetch'

const EMPTY = { name: '', role: '', specialty: '', exp: '', rating: '5.0', clients: '0' }

export default function TrainersPanel() {
  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [errors, setErrors]         = useState({})
  const [saving, setSaving]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    apiFetch('/api/trainers').then(r => r.json())
      .then(d => { setItems(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  const f = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(e => ({ ...e, [key]: '', submit: '' }))
  }

  const openCreate = () => { setForm(EMPTY); setErrors({}); setModal('create') }
  const openEdit   = item => {
    setForm({ name: item.name, role: item.role, specialty: item.specialty || '',
      exp: item.exp || '', rating: String(item.rating ?? 5.0), clients: String(item.clients ?? 0) })
    setErrors({}); setModal(item)
  }
  const closeModal = () => { setModal(null); setErrors({}) }

  const save = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.role.trim()) e.role = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    const isEdit = modal && modal !== 'create'
    try {
      const res = await apiFetch(isEdit ? `/api/trainers/${modal.id}` : '/api/trainers', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating: parseFloat(form.rating), clients: parseInt(form.clients) }),
      })
      const data = await res.json()
      if (data.success) { load(); closeModal() }
      else setErrors({ submit: data.error })
    } catch { setErrors({ submit: 'Server error. Please try again.' }) }
    setSaving(false)
  }

  const del = async id => {
    try {
      const res = await apiFetch(`/api/trainers/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) { setDeleteTarget(null); load() }
    } catch {}
  }

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Trainers</h1>
          <p className="admin__subtitle">{items.length} trainers · changes appear live on website</p>
        </div>
        <button className="admin__btn admin__btn--primary" onClick={openCreate}>+ Add Trainer</button>
      </div>

      <div className="admin__card">
        {loading ? (
          <div className="admin__empty"><div className="admin__empty-icon">⏳</div></div>
        ) : items.length === 0 ? (
          <div className="admin__empty">
            <div className="admin__empty-icon">👤</div>
            <div className="admin__empty-text">No trainers yet — add your first one!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>Specialty</th>
                  <th>Experience</th>
                  <th>Rating</th>
                  <th>Clients</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin__member-name">
                        <div className="admin__avatar">{item.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111' }}>{item.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#f5a623', fontWeight: 600 }}>{item.role}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#555', fontSize: '0.85rem' }}>{item.specialty || '—'}</td>
                    <td style={{ color: '#555' }}>{item.exp || '—'}</td>
                    <td>
                      <span style={{ color: '#f5a623', fontWeight: 700 }}>⭐ {item.rating}</span>
                    </td>
                    <td style={{ color: '#555' }}>{item.clients}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="admin__btn admin__btn--ghost admin__btn--sm" onClick={() => openEdit(item)}>✏ Edit</button>
                        <button className="admin__btn admin__btn--danger admin__btn--sm" onClick={() => setDeleteTarget(item)}>🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">{modal === 'create' ? '+ Add Trainer' : `Edit: ${modal.name}`}</h2>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>
            {errors.submit && <div className="admin__error-banner">⚠ {errors.submit}</div>}

            <div className="modal__row">
              <div className="modal__field">
                <label className="modal__label">Full Name *</label>
                <input className={`modal__input${errors.name ? ' modal__input--error' : ''}`}
                  value={form.name} onChange={e => f('name', e.target.value)} placeholder="Alex Johnson" />
                {errors.name && <span className="modal__error">{errors.name}</span>}
              </div>
              <div className="modal__field">
                <label className="modal__label">Role *</label>
                <input className={`modal__input${errors.role ? ' modal__input--error' : ''}`}
                  value={form.role} onChange={e => f('role', e.target.value)} placeholder="Personal Trainer" />
                {errors.role && <span className="modal__error">{errors.role}</span>}
              </div>
            </div>

            <div className="modal__field">
              <label className="modal__label">Specialty</label>
              <input className="modal__input" value={form.specialty}
                onChange={e => f('specialty', e.target.value)} placeholder="Strength & Conditioning" />
            </div>

            <div className="modal__row">
              <div className="modal__field">
                <label className="modal__label">Experience</label>
                <input className="modal__input" value={form.exp}
                  onChange={e => f('exp', e.target.value)} placeholder="8 years" />
              </div>
              <div className="modal__field">
                <label className="modal__label">Rating (0–5)</label>
                <input type="number" min="0" max="5" step="0.1" className="modal__input"
                  value={form.rating} onChange={e => f('rating', e.target.value)} placeholder="4.9" />
              </div>
            </div>

            <div className="modal__field">
              <label className="modal__label">Total Clients</label>
              <input type="number" min="0" className="modal__input"
                value={form.clients} onChange={e => f('clients', e.target.value)} placeholder="120" />
            </div>

            <div className="modal__actions">
              <button className="admin__btn admin__btn--ghost" onClick={closeModal}>Cancel</button>
              <button className="admin__btn admin__btn--primary" onClick={save} disabled={saving}>
                {saving ? '⏳ Saving…' : modal === 'create' ? '✓ Add Trainer' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal confirm-dialog">
            <div className="confirm-dialog__icon">🗑️</div>
            <div className="confirm-dialog__title">Delete Trainer?</div>
            <p className="confirm-dialog__text">Remove <strong>{deleteTarget.name}</strong> from the team? This cannot be undone.</p>
            <div className="modal__actions" style={{ justifyContent: 'center' }}>
              <button className="admin__btn admin__btn--ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="admin__btn admin__btn--danger" onClick={() => del(deleteTarget.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
