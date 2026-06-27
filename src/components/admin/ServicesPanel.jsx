import { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/apiFetch'

const EMPTY = { icon: '🏋️', title: '', desc: '', duration: '' }

export default function ServicesPanel() {
  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)   // null | 'create' | item-obj
  const [form, setForm]             = useState(EMPTY)
  const [errors, setErrors]         = useState({})
  const [saving, setSaving]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    apiFetch('/api/services').then(r => r.json())
      .then(d => { setItems(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  const f = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(e => ({ ...e, [key]: '', submit: '' }))
  }

  const openCreate = () => { setForm(EMPTY);     setErrors({}); setModal('create') }
  const openEdit   = item => { setForm({ icon: item.icon, title: item.title, desc: item.desc, duration: item.duration });
    setErrors({}); setModal(item) }
  const closeModal = () => { setModal(null); setErrors({}) }

  const save = async () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.desc.trim())  e.desc  = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    const isEdit = modal && modal !== 'create'
    try {
      const res = await apiFetch(isEdit ? `/api/services/${modal.id}` : '/api/services', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) { load(); closeModal() }
      else setErrors({ submit: data.error })
    } catch { setErrors({ submit: 'Server error. Please try again.' }) }
    setSaving(false)
  }

  const del = async id => {
    try {
      const res = await apiFetch(`/api/services/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) { setDeleteTarget(null); load() }
    } catch {}
  }

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Services</h1>
          <p className="admin__subtitle">{items.length} services · changes appear live on website</p>
        </div>
        <button className="admin__btn admin__btn--primary" onClick={openCreate}>+ Add Service</button>
      </div>

      <div className="admin__card">
        {loading ? (
          <div className="admin__empty"><div className="admin__empty-icon">⏳</div></div>
        ) : items.length === 0 ? (
          <div className="admin__empty">
            <div className="admin__empty-icon">🏋️</div>
            <div className="admin__empty-text">No services yet — add your first one!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '1.6rem', textAlign: 'center' }}>{item.icon}</td>
                    <td style={{ fontWeight: 600, color: '#111' }}>{item.title}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem', maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.desc}
                      </div>
                    </td>
                    <td>
                      {item.duration && <span className="badge badge--general">{item.duration}</span>}
                    </td>
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
              <h2 className="modal__title">{modal === 'create' ? '+ Add Service' : `Edit: ${modal.title}`}</h2>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>
            {errors.submit && <div className="admin__error-banner">⚠ {errors.submit}</div>}

            <div className="modal__row">
              <div className="modal__field">
                <label className="modal__label">Icon (emoji)</label>
                <input className="modal__input" value={form.icon} onChange={e => f('icon', e.target.value)} placeholder="🏋️" />
              </div>
              <div className="modal__field">
                <label className="modal__label">Duration</label>
                <input className="modal__input" value={form.duration} onChange={e => f('duration', e.target.value)} placeholder="60 min" />
              </div>
            </div>

            <div className="modal__field">
              <label className="modal__label">Title *</label>
              <input className={`modal__input${errors.title ? ' modal__input--error' : ''}`}
                value={form.title} onChange={e => f('title', e.target.value)} placeholder="Service name" />
              {errors.title && <span className="modal__error">{errors.title}</span>}
            </div>

            <div className="modal__field">
              <label className="modal__label">Description *</label>
              <textarea className={`modal__input${errors.desc ? ' modal__input--error' : ''}`}
                rows={3} value={form.desc} onChange={e => f('desc', e.target.value)} placeholder="Describe this service…" />
              {errors.desc && <span className="modal__error">{errors.desc}</span>}
            </div>

            <div className="modal__actions">
              <button className="admin__btn admin__btn--ghost" onClick={closeModal}>Cancel</button>
              <button className="admin__btn admin__btn--primary" onClick={save} disabled={saving}>
                {saving ? '⏳ Saving…' : modal === 'create' ? '✓ Add Service' : '✓ Save Changes'}
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
            <div className="confirm-dialog__title">Delete Service?</div>
            <p className="confirm-dialog__text">Delete "<strong>{deleteTarget.title}</strong>"? This cannot be undone.</p>
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
