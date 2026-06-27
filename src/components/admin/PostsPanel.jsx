import { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/apiFetch'

const EMPTY = { title: '', content: '', author: '', category: 'general', published: false }

export default function PostsPanel() {
  const [posts, setPosts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [errors, setErrors]         = useState({})
  const [saving, setSaving]         = useState(false)
  const [search, setSearch]         = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    apiFetch('/api/posts')
      .then(r => r.json())
      .then(d => { setPosts(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = posts.filter(p => {
    const q = search.toLowerCase()
    return !q || p.title.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
  })

  const f = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(e => ({ ...e, [key]: '', submit: '' }))
  }

  const openCreate = () => { setForm(EMPTY); setErrors({}); setEditTarget(null); setShowForm(true) }
  const openEdit   = p  => {
    setForm({ title: p.title, content: p.content, author: p.author, category: p.category, published: p.published })
    setErrors({}); setEditTarget(p); setShowForm(true)
  }
  const cancelForm = () => { setShowForm(false); setEditTarget(null); setErrors({}) }

  const save = async () => {
    const e = {}
    if (!form.title.trim())   e.title   = 'Title is required.'
    if (!form.content.trim()) e.content = 'Content is required.'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const res = await apiFetch(editTarget ? `/api/posts/${editTarget.id}` : '/api/posts', {
        method: editTarget ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) { load(); cancelForm() }
      else setErrors({ submit: data.error })
    } catch { setErrors({ submit: 'Server error. Please try again.' }) }
    setSaving(false)
  }

  const togglePublish = async post => {
    try {
      const res = await apiFetch(`/api/posts/${post.id}/publish`, { method: 'PATCH' })
      const d = await res.json()
      if (d.success) load()
    } catch {}
  }

  const deletePost = async id => {
    try {
      const res = await apiFetch(`/api/posts/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) { setDeleteTarget(null); load() }
    } catch {}
  }

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Posts</h1>
          <p className="admin__subtitle">
            {posts.length} total · {posts.filter(p => p.published).length} published
          </p>
        </div>
        {!showForm && (
          <button className="admin__btn admin__btn--primary" onClick={openCreate}>+ Create Post</button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="post-form">
          <div className="post-form__title">
            <span>{editTarget ? `Editing: ${editTarget.title}` : 'New Post'}</span>
            <button className="modal__close" onClick={cancelForm}>✕</button>
          </div>

          {errors.submit && <div className="admin__error-banner">⚠ {errors.submit}</div>}

          <div className="modal__field">
            <label className="modal__label">Title *</label>
            <input
              className={`modal__input${errors.title ? ' modal__input--error' : ''}`}
              value={form.title}
              onChange={e => f('title', e.target.value)}
              placeholder="Enter post title…"
            />
            {errors.title && <span className="modal__error">{errors.title}</span>}
          </div>

          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Author</label>
              <input
                className="modal__input"
                value={form.author}
                onChange={e => f('author', e.target.value)}
                placeholder="GymFit Team"
              />
            </div>
            <div className="modal__field">
              <label className="modal__label">Category</label>
              <select className="modal__input" value={form.category} onChange={e => f('category', e.target.value)}>
                <option value="general">General</option>
                <option value="fitness">Fitness</option>
                <option value="nutrition">Nutrition</option>
                <option value="motivation">Motivation</option>
              </select>
            </div>
          </div>

          <div className="modal__field">
            <label className="modal__label">Content *</label>
            <textarea
              className={`modal__input${errors.content ? ' modal__input--error' : ''}`}
              rows={9}
              value={form.content}
              onChange={e => f('content', e.target.value)}
              placeholder="Write your post content here…"
            />
            {errors.content && <span className="modal__error">{errors.content}</span>}
          </div>

          <label className="post-form__publish-toggle">
            <input
              type="checkbox"
              checked={form.published}
              onChange={e => f('published', e.target.checked)}
            />
            Publish immediately (visible on the website)
          </label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="admin__btn admin__btn--ghost" onClick={cancelForm}>Cancel</button>
            <button className="admin__btn admin__btn--primary" onClick={save} disabled={saving}>
              {saving ? '⏳ Saving…' : editTarget ? '✓ Save Changes' : '✓ Create Post'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {!showForm && (
        <div className="admin__toolbar">
          <input
            className="admin__search"
            placeholder="Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="admin__empty"><div className="admin__empty-icon">⏳</div></div>
      ) : filtered.length === 0 ? (
        <div className="admin__empty">
          <div className="admin__empty-icon">📝</div>
          <div className="admin__empty-text">
            {posts.length === 0 ? 'No posts yet — create your first post!' : 'No posts match your search.'}
          </div>
        </div>
      ) : (
        filtered.map(post => (
          <div key={post.id} className={`post-card post-card--${post.published ? 'published' : 'draft'}`}>
            <div className="post-card__header">
              <div className="post-card__title">{post.title}</div>
              <span className={`badge badge--${post.published ? 'published' : 'draft'}`}>
                {post.published ? '✓ Published' : '○ Draft'}
              </span>
            </div>
            <div className="post-card__meta">
              <span>✍ {post.author || 'GymFit Team'}</span>
              <span className={`badge badge--${post.category}`}>{post.category}</span>
              <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
              {post.updatedAt !== post.createdAt && (
                <span style={{ color: '#bbb' }}>edited {new Date(post.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
            <p className="post-card__content">{post.content}</p>
            <div className="post-card__actions">
              <button className="admin__btn admin__btn--ghost admin__btn--sm" onClick={() => openEdit(post)}>
                ✏ Edit
              </button>
              <button
                className={`admin__btn admin__btn--sm ${post.published ? 'admin__btn--ghost' : 'admin__btn--primary'}`}
                onClick={() => togglePublish(post)}
              >
                {post.published ? '⬇ Unpublish' : '⬆ Publish'}
              </button>
              <button className="admin__btn admin__btn--danger admin__btn--sm" onClick={() => setDeleteTarget(post)}>
                🗑 Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal confirm-dialog">
            <div className="confirm-dialog__icon">🗑️</div>
            <div className="confirm-dialog__title">Delete Post?</div>
            <p className="confirm-dialog__text">
              Delete "<strong>{deleteTarget.title}</strong>"? This cannot be undone.
            </p>
            <div className="modal__actions" style={{ justifyContent: 'center' }}>
              <button className="admin__btn admin__btn--ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="admin__btn admin__btn--danger" onClick={() => deletePost(deleteTarget.id)}>
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
