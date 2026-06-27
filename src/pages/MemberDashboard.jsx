import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/apiFetch'

// ─── Constants ───────────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',  icon: '📊', label: 'Overview'      },
  { id: 'profile',   icon: '👤', label: 'My Profile'    },
  { id: 'posts',     icon: '✏️', label: 'My Posts'      },
  { id: 'community', icon: '🌍', label: 'Community'     },
  { id: 'contact',   icon: '📧', label: 'Contact Admin' },
  { id: 'settings',  icon: '⚙️', label: 'Settings'      },
]

const PLAN_COLORS   = { Basic: '#6b7280', Pro: '#f5a623', Elite: '#8b5cf6' }
const PLAN_PRICES   = { Basic: '$29/mo',  Pro: '$59/mo',  Elite: '$99/mo'  }
const PLAN_FEATURES = {
  Basic: ['Gym Access (Mon–Fri)', 'Locker Room', 'Basic Equipment', 'Mobile App'],
  Pro:   ['Everything in Basic', 'All Group Classes', '1 Trainer Session/mo', 'Nutrition Guide', 'Guest Pass'],
  Elite: ['Everything in Pro', 'Unlimited Personal Training', 'Priority Booking', 'Spa Access', 'Dedicated Coach'],
}
const CATEGORIES   = ['general', 'fitness', 'nutrition', 'motivation', 'progress', 'question']
const AVATAR_COLORS = ['#f5a623','#e53e3e','#38a169','#3182ce','#805ad5','#d69e2e','#2d3748']

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—'

// ─── API Helpers ──────────────────────────────────────────────────────────────
async function api(url, opts = {}) {
  const r = await apiFetch(url, opts)
  const d = await r.json()
  if (!d.success) throw new Error(d.error || 'Request failed')
  return d
}
const apiPost = (url, body) => api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const apiPut  = (url, body) => api(url, { method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const apiDel  = (url)       => api(url, { method: 'DELETE' })

// ─── Shared Components ────────────────────────────────────────────────────────
function Alert({ type, msg }) {
  if (!msg) return null
  return <div className={`mb-alert mb-alert--${type}`}>{msg}</div>
}

// ─── Overview Panel ───────────────────────────────────────────────────────────
function OverviewPanel({ user }) {
  const plan    = user?.membershipPlan || 'Basic'
  const pc      = PLAN_COLORS[plan] || '#f5a623'
  const [notifs,    setNotifs]  = useState([])
  const [postCount, setCount]   = useState(null)
  const [loading,   setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [nRes, pRes] = await Promise.all([
          api('/api/member/notifications'),
          api('/api/member/posts'),
        ])
        setNotifs(nRes.data || [])
        setCount((pRes.data || []).length)
      } catch { /* silently ignore */ }
      setLoading(false)
    })()
  }, [])

  return (
    <div className="mb-panel">
      <div className="mb-welcome">
        <div>
          <h1 className="mb-welcome__title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="mb-welcome__sub">Here&apos;s your membership overview and latest updates.</p>
        </div>
        <div className="mb-avatar mb-avatar--lg" style={{ background: user?.avatarColor || pc }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="mb-stats">
        {[
          { label: 'Current Plan',  value: plan,                    extra: { color: pc } },
          { label: 'Monthly Rate',  value: PLAN_PRICES[plan] || '—' },
          { label: 'Posts Written', value: postCount ?? '…'         },
          { label: 'Member Since',  value: fmt(user?.createdAt)     },
        ].map(s => (
          <div className="mb-stat" key={s.label}>
            <div className="mb-stat__val" style={s.extra || {}}>{s.value}</div>
            <div className="mb-stat__lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-membership-card" style={{ borderColor: pc }}>
        <div className="mb-membership-card__head">
          <span className="mb-badge" style={{ background: pc }}>{plan} Plan</span>
          <h3 className="mb-membership-card__title">Your Membership Includes</h3>
        </div>
        <ul className="mb-feature-list">
          {(PLAN_FEATURES[plan] || PLAN_FEATURES.Basic).map(f => (
            <li key={f}><span style={{ color: pc }}>✓</span> {f}</li>
          ))}
        </ul>
      </div>

      <div className="mb-section">
        <h3 className="mb-section__title">Latest Updates</h3>
        {loading ? (
          <p className="mb-empty">Loading updates…</p>
        ) : !notifs.length ? (
          <p className="mb-empty">No updates yet — check back soon!</p>
        ) : (
          <div className="mb-notif-list">
            {notifs.slice(0, 6).map(n => (
              <div key={n.id} className={`mb-notif mb-notif--${n.priority || 'normal'}`}>
                <span className="mb-notif__icon">{n.type === 'announcement' ? '📢' : '📰'}</span>
                <div>
                  <div className="mb-notif__title">{n.title}</div>
                  <div className="mb-notif__msg">{n.message}</div>
                  <div className="mb-notif__time">{fmt(n.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Profile Panel ────────────────────────────────────────────────────────────
function ProfilePanel({ user, onUpdate }) {
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    bio: user?.bio || '', avatarColor: user?.avatarColor || '#f5a623',
  })
  const [status, setStatus] = useState({ msg: '', type: '' })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setStatus({ msg: '', type: '' })
    try {
      const d = await apiPut('/api/auth/profile', form)
      setStatus({ msg: 'Profile saved!', type: 'success' })
      if (onUpdate) onUpdate(d.user)
    } catch (err) {
      setStatus({ msg: err.message, type: 'error' })
    } finally { setSaving(false) }
  }

  return (
    <div className="mb-panel">
      <div className="mb-panel__header">
        <h2 className="mb-panel__title">My Profile</h2>
        <p className="mb-panel__sub">Update your personal information and avatar.</p>
      </div>

      <div className="mb-avatar-section">
        <div className="mb-avatar mb-avatar--xl" style={{ background: form.avatarColor }}>
          {(form.name || user?.name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="mb-label">Avatar Color</p>
          <div className="mb-color-grid">
            {AVATAR_COLORS.map(c => (
              <button key={c} type="button"
                className={`mb-color-btn${form.avatarColor === c ? ' mb-color-btn--active' : ''}`}
                style={{ background: c }}
                onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
              />
            ))}
          </div>
        </div>
      </div>

      <form className="mb-form" onSubmit={save}>
        <Alert type={status.type} msg={status.msg} />
        <div className="mb-field">
          <label className="mb-label">Full Name</label>
          <input className="mb-input" value={form.name} onChange={set('name')} placeholder="Your full name" />
        </div>
        <div className="mb-field">
          <label className="mb-label">Email Address</label>
          <input className="mb-input" value={user?.email || ''} disabled />
          <small className="mb-hint">Email cannot be changed.</small>
        </div>
        <div className="mb-field">
          <label className="mb-label">Phone Number</label>
          <input className="mb-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
        </div>
        <div className="mb-field">
          <label className="mb-label">Bio</label>
          <textarea className="mb-input mb-textarea" rows={4}
            value={form.bio} onChange={set('bio')}
            placeholder="Tell us a bit about yourself…" />
        </div>
        <button type="submit" className="mb-btn mb-btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

// ─── Post Form ────────────────────────────────────────────────────────────────
function PostForm({ post, onSave, onCancel }) {
  const [form, setForm] = useState({
    title:    post?.title    || '',
    content:  post?.content  || '',
    imageUrl: post?.imageUrl || '',
    category: post?.category || 'general',
    status:   post?.status   || 'published',
  })
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim())   { setError('Title is required.');   return }
    if (!form.content.trim()) { setError('Content is required.'); return }
    setSaving(true); setError('')
    try {
      if (post) await apiPut(`/api/member/posts/${post.id}`, form)
      else      await apiPost('/api/member/posts', form)
      onSave()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mb-panel">
      <div className="mb-panel__header">
        <h2 className="mb-panel__title">{post ? 'Edit Post' : 'New Post'}</h2>
        <button className="mb-btn mb-btn--outline" type="button" onClick={onCancel}>← Back</button>
      </div>
      <form className="mb-form" onSubmit={save}>
        {error && <Alert type="error" msg={error} />}
        <div className="mb-field">
          <label className="mb-label">Title *</label>
          <input className="mb-input" value={form.title} onChange={set('title')} placeholder="Post title" required />
        </div>
        <div className="mb-row">
          <div className="mb-field">
            <label className="mb-label">Category</label>
            <select className="mb-input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="mb-field">
            <label className="mb-label">Status</label>
            <select className="mb-input" value={form.status} onChange={set('status')}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className="mb-field">
          <label className="mb-label">Content *</label>
          <textarea className="mb-input mb-textarea mb-textarea--lg" rows={10}
            value={form.content} onChange={set('content')}
            placeholder="Share your thoughts, progress, tips, or questions…" required />
        </div>
        <div className="mb-field">
          <label className="mb-label">Image URL (optional)</label>
          <input className="mb-input" type="url" value={form.imageUrl} onChange={set('imageUrl')}
            placeholder="Image URL" />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview" className="mb-img-preview"
              onError={e => { e.target.style.display = 'none' }} />
          )}
        </div>
        <div className="mb-form-actions">
          <button type="submit" className="mb-btn mb-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : (post ? 'Update Post' : 'Publish Post')}
          </button>
          <button type="button" className="mb-btn mb-btn--outline" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

// ─── My Posts Panel ───────────────────────────────────────────────────────────
function MyPostsPanel() {
  const [posts,   setPosts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [view,    setView]   = useState('list')
  const [editPost, setEdit]  = useState(null)
  const [flash,   setFlash]  = useState({ msg: '', type: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try { const d = await api('/api/member/posts'); setPosts(d.data || []) }
    catch { setPosts([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const del = async (id) => {
    if (!window.confirm('Delete this post?')) return
    try {
      await apiDel(`/api/member/posts/${id}`)
      setPosts(p => p.filter(x => x.id !== id))
      setFlash({ msg: 'Post deleted.', type: 'success' })
    } catch (err) { setFlash({ msg: err.message, type: 'error' }) }
  }

  if (view === 'create' || view === 'edit') {
    return (
      <PostForm
        post={view === 'edit' ? editPost : null}
        onSave={() => { load(); setView('list'); setFlash({ msg: 'Post saved!', type: 'success' }) }}
        onCancel={() => setView('list')}
      />
    )
  }

  return (
    <div className="mb-panel">
      <div className="mb-panel__header">
        <div>
          <h2 className="mb-panel__title">My Posts</h2>
          <p className="mb-panel__sub">Create and manage your community posts.</p>
        </div>
        <button className="mb-btn mb-btn--primary" onClick={() => setView('create')}>+ New Post</button>
      </div>
      <Alert type={flash.type} msg={flash.msg} />
      {loading ? (
        <p className="mb-empty">Loading posts…</p>
      ) : !posts.length ? (
        <div className="mb-empty-state">
          <div className="mb-empty-icon">✏️</div>
          <p>You haven&apos;t written any posts yet.</p>
          <button className="mb-btn mb-btn--primary" onClick={() => setView('create')}>Write your first post</button>
        </div>
      ) : (
        <div className="mb-post-list">
          {posts.map(post => (
            <div key={post.id} className="mb-post-card">
              <div className="mb-post-card__meta">
                <span className={`mb-status mb-status--${post.status}`}>{post.status}</span>
                <span className="mb-muted">{fmt(post.createdAt)}</span>
                <span className="mb-cat">{post.category}</span>
              </div>
              <h3 className="mb-post-card__title">{post.title}</h3>
              <p className="mb-post-card__excerpt">
                {post.content.length > 180 ? post.content.slice(0, 180) + '…' : post.content}
              </p>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="" className="mb-post-thumb"
                  onError={e => { e.target.style.display = 'none' }} />
              )}
              <div className="mb-post-card__actions">
                <button className="mb-btn mb-btn--sm mb-btn--outline"
                  onClick={() => { setEdit(post); setView('edit') }}>Edit</button>
                <button className="mb-btn mb-btn--sm mb-btn--danger"
                  onClick={() => del(post.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Community Panel ──────────────────────────────────────────────────────────
function CommunityPanel() {
  const [posts,    setPosts]   = useState([])
  const [ann,      setAnn]     = useState([])
  const [loading,  setLoading] = useState(true)
  const [tab,      setTab]     = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [pRes, aRes] = await Promise.all([
          api('/api/community'),
          api('/api/announcements'),
        ])
        setPosts(pRes.data || [])
        setAnn(aRes.data   || [])
      } catch { /* silently ignore */ }
      setLoading(false)
    })()
  }, [])

  if (selected) {
    return (
      <div className="mb-panel">
        <button className="mb-btn mb-btn--outline mb-back-btn" onClick={() => setSelected(null)}>
          ← Back to Community
        </button>
        <article className="mb-article">
          <div className="mb-article__meta">
            <span className="mb-cat">{selected.category || (selected._type === 'announcement' ? 'announcement' : 'general')}</span>
            <span className="mb-muted">{fmt(selected.createdAt)}</span>
            {selected.authorName && <span className="mb-muted">by {selected.authorName}</span>}
          </div>
          <h1 className="mb-article__title">{selected.title}</h1>
          {selected.imageUrl && (
            <img src={selected.imageUrl} alt="" className="mb-article__img"
              onError={e => { e.target.style.display = 'none' }} />
          )}
          <div className="mb-article__body">{selected.content}</div>
        </article>
      </div>
    )
  }

  const all = [
    ...ann.map(a   => ({ ...a, _type: 'announcement' })),
    ...posts.map(p => ({ ...p, _type: 'post' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const filtered =
    tab === 'all'           ? all :
    tab === 'announcements' ? ann.map(a   => ({ ...a, _type: 'announcement' })) :
                              posts.map(p => ({ ...p, _type: 'post' }))

  return (
    <div className="mb-panel">
      <div className="mb-panel__header">
        <div>
          <h2 className="mb-panel__title">Community</h2>
          <p className="mb-panel__sub">Announcements, gym news, and member posts.</p>
        </div>
      </div>
      <div className="mb-tabs">
        {[['all','All'],['announcements','Announcements'],['posts','Member Posts']].map(([id, lbl]) => (
          <button key={id} className={`mb-tab${tab === id ? ' mb-tab--active' : ''}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>
      {loading ? (
        <p className="mb-empty">Loading…</p>
      ) : !filtered.length ? (
        <div className="mb-empty-state">
          <div className="mb-empty-icon">📭</div>
          <p>Nothing here yet — check back soon!</p>
        </div>
      ) : (
        <div className="mb-community-grid">
          {filtered.map(item => (
            <div key={item.id}
              className={`mb-community-card mb-community-card--${item._type}`}
              onClick={() => setSelected(item)}>
              <div className="mb-community-card__type">
                {item._type === 'announcement' ? '📢 Announcement' : '✏️ Community Post'}
              </div>
              {item.imageUrl && (
                <img src={item.imageUrl} alt="" className="mb-community-card__img"
                  onError={e => { e.target.style.display = 'none' }} />
              )}
              <h3 className="mb-community-card__title">{item.title}</h3>
              <p className="mb-community-card__excerpt">
                {item.content.length > 140 ? item.content.slice(0, 140) + '…' : item.content}
              </p>
              <div className="mb-community-card__meta">
                <span>{fmt(item.createdAt)}</span>
                {item.authorName && <span>by {item.authorName}</span>}
                {item.category   && <span className="mb-cat">{item.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Contact Panel ────────────────────────────────────────────────────────────
function ContactPanel({ user }) {
  const [form, setForm]     = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', message: '' })
  const [history, setHist]  = useState([])
  const [histLoading, setHL] = useState(true)
  const [sending,  setSending] = useState(false)
  const [status,   setStatus]  = useState({ msg: '', type: '' })
  const [tab,      setTab]     = useState('send')
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const loadHistory = useCallback(async () => {
    setHL(true)
    try { const d = await api('/api/member/contacts'); setHist(d.data || []) }
    catch { setHist([]) }
    finally { setHL(false) }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const send = async (e) => {
    e.preventDefault()
    if (!form.message.trim()) { setStatus({ msg: 'Message is required.', type: 'error' }); return }
    setSending(true); setStatus({ msg: '', type: '' })
    try {
      const d = await apiPost('/api/contact', form)
      setStatus({ msg: d.message || 'Message sent!', type: 'success' })
      setForm(f => ({ ...f, message: '' }))
      loadHistory()
    } catch (err) { setStatus({ msg: err.message, type: 'error' }) }
    finally { setSending(false) }
  }

  return (
    <div className="mb-panel">
      <div className="mb-panel__header">
        <div>
          <h2 className="mb-panel__title">Contact Admin</h2>
          <p className="mb-panel__sub">Send us a message — we respond within 24 hours.</p>
        </div>
      </div>
      <div className="mb-tabs">
        {[['send','Send Message'],['history','Message History']].map(([id, lbl]) => (
          <button key={id} className={`mb-tab${tab === id ? ' mb-tab--active' : ''}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>
      {tab === 'send' ? (
        <form className="mb-form" onSubmit={send}>
          <Alert type={status.type} msg={status.msg} />
          <div className="mb-row">
            <div className="mb-field">
              <label className="mb-label">Name</label>
              <input className="mb-input" value={form.name} onChange={set('name')} required />
            </div>
            <div className="mb-field">
              <label className="mb-label">Email</label>
              <input className="mb-input" type="email" value={form.email} onChange={set('email')} required />
            </div>
          </div>
          <div className="mb-field">
            <label className="mb-label">Phone (optional)</label>
            <input className="mb-input" type="tel" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="mb-field">
            <label className="mb-label">Message *</label>
            <textarea className="mb-input mb-textarea mb-textarea--lg" rows={8}
              value={form.message} onChange={set('message')}
              placeholder="How can we help you today?" required />
          </div>
          <button type="submit" className="mb-btn mb-btn--primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      ) : (
        <div>
          {histLoading ? (
            <p className="mb-empty">Loading history…</p>
          ) : !history.length ? (
            <div className="mb-empty-state">
              <div className="mb-empty-icon">📭</div>
              <p>No messages sent yet.</p>
            </div>
          ) : history.map(msg => (
            <div key={msg.id} className="mb-msg-card">
              <div className="mb-msg-card__date">{fmt(msg.createdAt)}</div>
              <p className="mb-msg-card__text">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ user }) {
  const [pw, setPw]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [st, setSt]   = useState({ msg: '', type: '' })
  const [saving, setSv] = useState(false)
  const setp = (k) => (e) => setPw(f => ({ ...f, [k]: e.target.value }))

  const changePw = async (e) => {
    e.preventDefault()
    if (!pw.currentPassword || !pw.newPassword) return setSt({ msg: 'All fields required.', type: 'error' })
    if (pw.newPassword.length < 8)              return setSt({ msg: 'Min 8 characters.', type: 'error' })
    if (pw.newPassword !== pw.confirmPassword)  return setSt({ msg: 'Passwords do not match.', type: 'error' })
    setSv(true); setSt({ msg: '', type: '' })
    try {
      const d = await apiPut('/api/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      setSt({ msg: d.message || 'Password updated!', type: 'success' })
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { setSt({ msg: err.message, type: 'error' }) }
    finally { setSv(false) }
  }

  return (
    <div className="mb-panel">
      <div className="mb-panel__header">
        <h2 className="mb-panel__title">Account Settings</h2>
        <p className="mb-panel__sub">Manage your security and account details.</p>
      </div>

      <div className="mb-info-card">
        <h3 className="mb-info-card__title">Account Info</h3>
        {[
          ['Name',   user?.name],
          ['Email',  user?.email],
          ['Role',   user?.role],
          ['Plan',   user?.membershipPlan || 'Basic'],
          ['Joined', fmt(user?.createdAt)],
        ].map(([k, v]) => (
          <div key={k} className="mb-info-row">
            <span className="mb-info-row__key">{k}</span>
            <span className="mb-info-row__val">{v}</span>
          </div>
        ))}
      </div>

      <div className="mb-section">
        <h3 className="mb-section__title">Change Password</h3>
        <form className="mb-form" onSubmit={changePw}>
          <Alert type={st.type} msg={st.msg} />
          <div className="mb-field">
            <label className="mb-label">Current Password</label>
            <input type="password" className="mb-input" value={pw.currentPassword}
              onChange={setp('currentPassword')} placeholder="Current password" />
          </div>
          <div className="mb-field">
            <label className="mb-label">New Password</label>
            <input type="password" className="mb-input" value={pw.newPassword}
              onChange={setp('newPassword')} placeholder="Min. 8 characters" />
          </div>
          <div className="mb-field">
            <label className="mb-label">Confirm New Password</label>
            <input type="password" className="mb-input" value={pw.confirmPassword}
              onChange={setp('confirmPassword')} placeholder="Repeat new password" />
          </div>
          <button type="submit" className="mb-btn mb-btn--primary" disabled={saving}>
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Root Dashboard ───────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const { user, logout, updateUser } = useAuth()
  const navigate   = useNavigate()
  const [active,      setActive]  = useState('overview')
  const [sidebarOpen, setSidebar] = useState(false)

  const doLogout = () => { logout(); navigate('/') }

  return (
    <div className="member">
      {sidebarOpen && <div className="member__overlay" onClick={() => setSidebar(false)} />}

      {/* Sidebar */}
      <aside className={`member__sidebar${sidebarOpen ? ' member__sidebar--open' : ''}`}>
        <div className="member__brand">
          <span>💪</span><span>GymFit</span>
        </div>

        {user && (
          <div className="member__user-info">
            <div className="member__avatar" style={{ background: user.avatarColor || '#f5a623' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="member__user-name">{user.name}</div>
              <div className="member__user-role">{user.membershipPlan || 'Basic'} Member</div>
            </div>
          </div>
        )}

        <div className="member__section-label">Member Area</div>

        <nav className="member__nav">
          {NAV.map(item => (
            <button key={item.id}
              className={`member__nav-item${active === item.id ? ' member__nav-item--active' : ''}`}
              onClick={() => { setActive(item.id); setSidebar(false) }}>
              <span className="member__nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="member__sidebar-footer">
          <a href="#/" className="member__back">← Back to Website</a>
          <button className="member__logout-btn" onClick={doLogout}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main body */}
      <div className="member__body">
        <div className="member__topbar">
          <button className="member__mobile-toggle" onClick={() => setSidebar(o => !o)}>☰</button>
          <span className="member__topbar-title">
            {NAV.find(n => n.id === active)?.icon} {NAV.find(n => n.id === active)?.label}
          </span>
          <div className="member__topbar-actions">
            <a href="#/" className="member__topbar-back">← Site</a>
            <button className="member__topbar-logout" onClick={doLogout}>Logout</button>
          </div>
        </div>

        <main className="member__main">
          {active === 'overview'  && <OverviewPanel  user={user} />}
          {active === 'profile'   && <ProfilePanel   user={user} onUpdate={updateUser} />}
          {active === 'posts'     && <MyPostsPanel />}
          {active === 'community' && <CommunityPanel />}
          {active === 'contact'   && <ContactPanel   user={user} />}
          {active === 'settings'  && <SettingsPanel  user={user} />}
        </main>
      </div>
    </div>
  )
}
