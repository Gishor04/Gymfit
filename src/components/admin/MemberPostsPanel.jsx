import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../../utils/apiFetch'

const CATEGORIES = ['all', 'general', 'fitness', 'nutrition', 'motivation', 'progress', 'question']
const STATUSES   = ['all', 'published', 'draft']

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export default function MemberPostsPanel() {
  const [posts,        setPosts]     = useState([])
  const [loading,      setLoading]   = useState(true)
  const [search,       setSearch]    = useState('')
  const [filterStatus, setFilterSt]  = useState('all')
  const [filterCat,    setFilterCat] = useState('all')
  const [deleteTarget, setDeleteTgt] = useState(null)
  const [viewPost,     setViewPost]  = useState(null)
  const [flash,        setFlash]     = useState({ msg: '', type: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status',   filterStatus)
      if (filterCat    !== 'all') params.set('category', filterCat)
      if (search.trim())          params.set('search',   search.trim())
      const r = await apiFetch(`/api/admin/member-posts?${params}`)
      const d = await r.json()
      setPosts(d.data || [])
    } catch { setPosts([]) }
    finally { setLoading(false) }
  }, [filterStatus, filterCat, search])

  useEffect(() => { load() }, [load])

  const flash_ = (msg, type = 'success') => {
    setFlash({ msg, type })
    setTimeout(() => setFlash({ msg: '', type: '' }), 3500)
  }

  const del = async (id) => {
    try {
      const r = await apiFetch(`/api/admin/member-posts/${id}`, { method: 'DELETE' })
      const d = await r.json()
      if (d.success) { setDeleteTgt(null); flash_('Post deleted.'); load() }
      else flash_(d.error || 'Delete failed.', 'error')
    } catch { flash_('Server error.', 'error') }
  }

  const published = posts.filter(p => p.status === 'published').length
  const drafts    = posts.filter(p => p.status === 'draft').length

  return (
    <div>
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Member Posts</h1>
          <p className="admin__subtitle">
            {posts.length} total &middot; {published} published &middot; {drafts} draft
            <span style={{ marginLeft: 12, fontSize: '0.8rem', color: '#aaa' }}>
              (view &amp; delete only — members own their content)
            </span>
          </p>
        </div>
      </div>

      {flash.msg && (
        <div className={`admin__flash admin__flash--${flash.type}`}>{flash.msg}</div>
      )}

      {/* Filters */}
      <div className="admin__toolbar">
        <input
          className="admin__search"
          placeholder="Search by title, content, or author…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="admin__select" value={filterStatus} onChange={e => setFilterSt(e.target.value)}>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select className="admin__select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Posts Table */}
      <div className="admin__card">
        {loading ? (
          <div className="admin__empty"><div className="admin__empty-icon">⏳</div></div>
        ) : !posts.length ? (
          <div className="admin__empty">
            <div className="admin__empty-icon">✏️</div>
            <div className="admin__empty-text">No member posts found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id}>
                    <td>
                      <div style={{ maxWidth: 260 }}>
                        <div style={{ fontWeight: 600, color: '#111', marginBottom: 2 }}>{post.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {post.content}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="admin__avatar" style={{ width: 28, height: 28, fontSize: '0.8rem', flexShrink: 0 }}>
                          {post.authorName?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#444' }}>{post.authorName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge--${post.category}`}>{post.category}</span>
                    </td>
                    <td>
                      <span className={`badge badge--${post.status === 'published' ? 'published' : 'draft'}`}>
                        {post.status === 'published' ? '✓ Published' : '○ Draft'}
                      </span>
                    </td>
                    <td style={{ color: '#888', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{fmt(post.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="admin__btn admin__btn--ghost admin__btn--sm" onClick={() => setViewPost(post)}>
                          👁 View
                        </button>
                        <button className="admin__btn admin__btn--danger admin__btn--sm" onClick={() => setDeleteTgt(post)}>
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

      {/* View Modal — read-only */}
      {viewPost && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewPost(null)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal__header">
              <h2 className="modal__title">Member Post</h2>
              <button className="modal__close" onClick={() => setViewPost(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge badge--${viewPost.status === 'published' ? 'published' : 'draft'}`}>
                {viewPost.status}
              </span>
              <span className={`badge badge--${viewPost.category}`}>{viewPost.category}</span>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>by {viewPost.authorName}</span>
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{fmt(viewPost.createdAt)}</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111', marginBottom: 12 }}>{viewPost.title}</h3>
            {viewPost.imageUrl && (
              <img src={viewPost.imageUrl} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                onError={e => { e.target.style.display = 'none' }} />
            )}
            <div style={{ fontSize: '0.9rem', color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
              {viewPost.content}
            </div>
            <div className="modal__actions" style={{ justifyContent: 'space-between', marginTop: 16 }}>
              <button className="admin__btn admin__btn--danger admin__btn--sm"
                onClick={() => { setViewPost(null); setDeleteTgt(viewPost) }}>
                🗑 Delete Post
              </button>
              <button className="admin__btn admin__btn--ghost" onClick={() => setViewPost(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTgt(null)}>
          <div className="modal confirm-dialog">
            <div className="confirm-dialog__icon">🗑️</div>
            <div className="confirm-dialog__title">Delete Post?</div>
            <p className="confirm-dialog__text">
              Delete <strong>&ldquo;{deleteTarget.title}&rdquo;</strong> by {deleteTarget.authorName}?
              This cannot be undone.
            </p>
            <div className="modal__actions" style={{ justifyContent: 'center' }}>
              <button className="admin__btn admin__btn--ghost" onClick={() => setDeleteTgt(null)}>Cancel</button>
              <button className="admin__btn admin__btn--danger" onClick={() => del(deleteTarget.id)}>
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
