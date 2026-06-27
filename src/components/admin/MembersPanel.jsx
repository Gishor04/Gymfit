import { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/apiFetch'

const EMPTY = { name: '', email: '', phone: '', membershipPlan: 'Basic', status: 'active', notes: '' }

export default function MembersPanel() {
  const [members, setMembers]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterPlan, setFilterPlan]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal]             = useState(null)   // null | 'create' | member-obj
  const [form, setForm]               = useState(EMPTY)
  const [errors, setErrors]           = useState({})
  const [saving, setSaving]           = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    apiFetch('/api/members')
      .then(r => r.json())
      .then(d => { setMembers(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const okQ  = !q || m.name.toLowerCase().includes(q) || m.email.includes(q) || m.phone.includes(q)
    const okP  = !filterPlan   || m.membershipPlan === filterPlan
    const okS  = !filterStatus || m.status === filterStatus
    return okQ && okP && okS
  })

  const field = (f, v) => {
    setForm(p => ({ ...p, [f]: v }))
    setErrors(e => ({ ...e, [f]: '', submit: '' }))
  }

  const openCreate = () => { setForm(EMPTY);            setErrors({}); setModal('create') }
  const openEdit   = m  => { setForm({ name: m.name, email: m.email, phone: m.phone || '',
      membershipPlan: m.membershipPlan, status: m.status, notes: m.notes || '' });
    setErrors({}); setModal(m) }
  const closeModal = () => { setModal(null); setErrors({}) }

  const save = async () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    const isEdit = modal && modal !== 'create'
    try {
      const res = await apiFetch(isEdit ? `/api/members/${modal.id}` : '/api/members', {
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

  const deleteMember = async id => {
    try {
      const res = await apiFetch(`/api/members/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) { setDeleteTarget(null); load() }
    } catch {}
  }

  const planColor = { Basic: 'basic', Pro: 'pro', Elite: 'elite' }

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Members</h1>
          <p className="admin__subtitle">
            {members.length} total · {members.filter(m => m.status === 'active').length} active
          </p>
        </div>
        <button className="admin__btn admin__btn--primary" onClick={openCreate}>+ Add Member</button>
      </div>

      {/* Toolbar */}
      <div className="admin__toolbar">
        <input
          className="admin__search"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="admin__select" value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
          <option value="">All Plans</option>
          <option value="Basic">Basic</option>
          <option value="Pro">Pro</option>
          <option value="Elite">Elite</option>
        </select>
        <select className="admin__select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin__card">
        {loading ? (
          <div className="admin__empty"><div className="admin__empty-icon">⏳</div></div>
        ) : filtered.length === 0 ? (
          <div className="admin__empty">
            <div className="admin__empty-icon">👥</div>
            <div className="admin__empty-text">
              {members.length === 0 ? 'No members yet — add your first member!' : 'No members match your filters.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="admin__member-name">
                        <div className="admin__avatar">{m.name[0].toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111' }}>{m.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#555' }}>{m.phone || '—'}</td>
                    <td><span className={`badge badge--${planColor[m.membershipPlan] || 'basic'}`}>{m.membershipPlan}</span></td>
                    <td><span className={`badge badge--${m.status}`}>{m.status}</span></td>
                    <td style={{ color: '#888', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {new Date(m.joinDate).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="admin__btn admin__btn--ghost admin__btn--sm" onClick={() => openEdit(m)}>
                          ✏ Edit
                        </button>
                        <button className="admin__btn admin__btn--danger admin__btn--sm" onClick={() => setDeleteTarget(m)}>
                          🗑 Delete
                        </button>
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
              <h2 className="modal__title">
                {modal === 'create' ? '+ Add New Member' : `Edit: ${modal.name}`}
              </h2>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>

            {errors.submit && (
              <div className="admin__error-banner">⚠ {errors.submit}</div>
            )}

            <div className="modal__row">
              <div className="modal__field">
                <label className="modal__label">Full Name *</label>
                <input
                  className={`modal__input${errors.name ? ' modal__input--error' : ''}`}
                  value={form.name}
                  onChange={e => field('name', e.target.value)}
                  placeholder="John Doe"
                />
                {errors.name && <span className="modal__error">{errors.name}</span>}
              </div>
              <div className="modal__field">
                <label className="modal__label">Email Address *</label>
                <input
                  type="email"
                  className={`modal__input${errors.email ? ' modal__input--error' : ''}`}
                  value={form.email}
                  onChange={e => field('email', e.target.value)}
                  placeholder="john@example.com"
                />
                {errors.email && <span className="modal__error">{errors.email}</span>}
              </div>
            </div>

            <div className="modal__row">
              <div className="modal__field">
                <label className="modal__label">Phone Number</label>
                <input
                  className="modal__input"
                  value={form.phone}
                  onChange={e => field('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="modal__field">
                <label className="modal__label">Membership Plan</label>
                <select className="modal__input" value={form.membershipPlan} onChange={e => field('membershipPlan', e.target.value)}>
                  <option value="Basic">Basic – $29/mo</option>
                  <option value="Pro">Pro – $59/mo</option>
                  <option value="Elite">Elite – $99/mo</option>
                </select>
              </div>
            </div>

            <div className="modal__row">
              <div className="modal__field">
                <label className="modal__label">Status</label>
                <select className="modal__input" value={form.status} onChange={e => field('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="modal__field">
              <label className="modal__label">Notes</label>
              <textarea
                className="modal__input"
                rows={3}
                value={form.notes}
                onChange={e => field('notes', e.target.value)}
                placeholder="Optional notes about this member…"
              />
            </div>

            <div className="modal__actions">
              <button className="admin__btn admin__btn--ghost" onClick={closeModal}>Cancel</button>
              <button className="admin__btn admin__btn--primary" onClick={save} disabled={saving}>
                {saving ? '⏳ Saving…' : modal === 'create' ? '✓ Add Member' : '✓ Save Changes'}
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
            <div className="confirm-dialog__title">Delete Member?</div>
            <p className="confirm-dialog__text">
              Are you sure you want to remove <strong>{deleteTarget.name}</strong> from the system?
              This action cannot be undone.
            </p>
            <div className="modal__actions" style={{ justifyContent: 'center' }}>
              <button className="admin__btn admin__btn--ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="admin__btn admin__btn--danger" onClick={() => deleteMember(deleteTarget.id)}>
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
