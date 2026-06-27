import { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/apiFetch'

const EMPTY = { name: '', price: '', popular: false, featuresText: '' }

const toText  = arr  => (arr || []).join('\n')
const toArray = text => text.split('\n').map(l => l.trim()).filter(Boolean)

export default function PlansPanel() {
  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [errors, setErrors]         = useState({})
  const [saving, setSaving]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    apiFetch('/api/membership').then(r => r.json())
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
    setForm({ name: item.name, price: String(item.price), popular: item.popular, featuresText: toText(item.features) })
    setErrors({}); setModal(item)
  }
  const closeModal = () => { setModal(null); setErrors({}) }

  const save = async () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Required'
    if (!form.price.trim()) e.price = 'Required'
    else if (isNaN(Number(form.price))) e.price = 'Must be a number'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    const isEdit = modal && modal !== 'create'
    const payload = { name: form.name.trim(), price: parseFloat(form.price),
      popular: form.popular, features: toArray(form.featuresText) }
    try {
      const res = await apiFetch(isEdit ? `/api/membership/${modal.id}` : '/api/membership', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) { load(); closeModal() }
      else setErrors({ submit: data.error })
    } catch { setErrors({ submit: 'Server error. Please try again.' }) }
    setSaving(false)
  }

  const del = async id => {
    try {
      const res = await apiFetch(`/api/membership/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) { setDeleteTarget(null); load() }
    } catch {}
  }

  const planColor = { Basic: 'basic', Pro: 'pro', Elite: 'elite' }

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Membership Plans</h1>
          <p className="admin__subtitle">{items.length} plans · changes appear live on website</p>
        </div>
        <button className="admin__btn admin__btn--primary" onClick={openCreate}>+ Add Plan</button>
      </div>

      {loading ? (
        <div className="admin__empty"><div className="admin__empty-icon">⏳</div></div>
      ) : items.length === 0 ? (
        <div className="admin__empty">
          <div className="admin__empty-icon">💳</div>
          <div className="admin__empty-text">No plans yet — add your first one!</div>
        </div>
      ) : (
        <div className="plans__grid">
          {items.map(item => (
            <div key={item.id} className={`plans__card${item.popular ? ' plans__card--popular' : ''}`}>
              {item.popular && <div className="plans__badge">Most Popular</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className={`badge badge--${planColor[item.name?.toLowerCase()] || 'basic'}`} style={{ fontSize: '0.82rem' }}>
                  {item.name}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="admin__btn admin__btn--ghost admin__btn--sm" onClick={() => openEdit(item)}>✏ Edit</button>
                  <button className="admin__btn admin__btn--danger admin__btn--sm" onClick={() => setDeleteTarget(item)}>🗑</button>
                </div>
              </div>

              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#111', lineHeight: 1, marginBottom: 4 }}>
                ${item.price}<span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 400 }}>/mo</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(item.features || []).map((feat, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: '#555', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span> {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">{modal === 'create' ? '+ Add Plan' : `Edit: ${modal.name}`}</h2>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>
            {errors.submit && <div className="admin__error-banner">⚠ {errors.submit}</div>}

            <div className="modal__row">
              <div className="modal__field">
                <label className="modal__label">Plan Name *</label>
                <input className={`modal__input${errors.name ? ' modal__input--error' : ''}`}
                  value={form.name} onChange={e => f('name', e.target.value)} placeholder="Pro" />
                {errors.name && <span className="modal__error">{errors.name}</span>}
              </div>
              <div className="modal__field">
                <label className="modal__label">Price ($/month) *</label>
                <input type="number" min="0" className={`modal__input${errors.price ? ' modal__input--error' : ''}`}
                  value={form.price} onChange={e => f('price', e.target.value)} placeholder="59" />
                {errors.price && <span className="modal__error">{errors.price}</span>}
              </div>
            </div>

            <div className="modal__field">
              <label className="post-form__publish-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.popular} onChange={e => f('popular', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#f5a623', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>Mark as "Most Popular"</span>
              </label>
            </div>

            <div className="modal__field">
              <label className="modal__label">Features (one per line)</label>
              <textarea className="modal__input" rows={8} value={form.featuresText}
                onChange={e => f('featuresText', e.target.value)}
                placeholder={'Unlimited Gym Access\nAll Group Classes\nNutrition Guide\nApp Access'} />
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Each line becomes one feature bullet point</span>
            </div>

            <div className="modal__actions">
              <button className="admin__btn admin__btn--ghost" onClick={closeModal}>Cancel</button>
              <button className="admin__btn admin__btn--primary" onClick={save} disabled={saving}>
                {saving ? '⏳ Saving…' : modal === 'create' ? '✓ Add Plan' : '✓ Save Changes'}
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
            <div className="confirm-dialog__title">Delete Plan?</div>
            <p className="confirm-dialog__text">Delete the "<strong>{deleteTarget.name}</strong>" plan? This cannot be undone.</p>
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
