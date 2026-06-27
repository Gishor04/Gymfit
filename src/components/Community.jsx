import { useState, useEffect } from 'react'

export default function Community() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/posts?published=true')
      .then(r => r.json())
      .then(d => { setPosts(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (!loading && posts.length === 0) return null

  return (
    <section id="community" className="community">
      <div className="community__inner">
        <h2 className="section-title">Community Stories</h2>
        <p className="section-subtitle">
          Inspiration, fitness tips, and success stories from the GymFit community
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading posts…</div>
        ) : (
          <div className="community__grid">
            {posts.map(p => (
              <article key={p.id} className="community__card">
                <div className="community__card-category">{p.category}</div>
                <h3 className="community__card-title">{p.title}</h3>
                <p className="community__card-content">{p.content}</p>
                <div className="community__card-meta">
                  <span>✍ {p.author || 'GymFit Team'}</span>
                  <span>📅 {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
