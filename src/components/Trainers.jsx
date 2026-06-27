import { useState, useEffect } from 'react'

const FALLBACK = [
  { id: 1, name: 'Alex Johnson',   role: 'Personal Trainer',   exp: '8 years',  specialty: 'Strength & Conditioning', rating: 4.9, clients: 120 },
  { id: 2, name: 'Sarah Williams', role: 'Yoga Instructor',    exp: '6 years',  specialty: 'Hatha & Vinyasa Yoga',    rating: 4.8, clients: 95  },
  { id: 3, name: 'Mike Chen',      role: 'Boxing Coach',       exp: '10 years', specialty: 'Combat & HIIT',           rating: 5.0, clients: 140 },
  { id: 4, name: 'Emma Davis',     role: 'Cardio Specialist',  exp: '5 years',  specialty: 'Endurance & Fat Loss',    rating: 4.7, clients: 88  },
]

export default function Trainers() {
  const [trainers, setTrainers] = useState(FALLBACK)

  useEffect(() => {
    fetch('/api/trainers')
      .then(r => r.json())
      .then(d => { if (d.success) setTrainers(d.data) })
      .catch(() => {})
  }, [])

  return (
    <section id="trainers" className="trainers">
      <div className="trainers__inner">
        <h2 className="section-title">Our Trainers</h2>
        <p className="section-subtitle">Meet our certified fitness experts dedicated to your success</p>
        <div className="trainers__grid">
          {trainers.map(t => (
            <div key={t.id} className="trainers__card">
              <div className="trainers__avatar">{t.name[0]}</div>
              <h3 className="trainers__name">{t.name}</h3>
              <p className="trainers__role">{t.role}</p>
              <p className="trainers__specialty">{t.specialty}</p>
              <div className="trainers__meta">
                <span>⭐ {t.rating}</span>
                <span>🗓 {t.exp}</span>
                <span>👥 {t.clients} clients</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
