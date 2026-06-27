import { useState, useEffect } from 'react'

const FALLBACK = [
  { id: 1, icon: '🏋️', title: 'Personal Training',  desc: 'One-on-one sessions with certified trainers tailored to your goals.',  duration: '60 min' },
  { id: 2, icon: '🏃', title: 'Cardio Training',    desc: 'Boost stamina and heart health with expert-guided cardio programs.',   duration: '45 min' },
  { id: 3, icon: '🧘', title: 'Yoga Classes',       desc: 'Relax your body and mind with daily yoga and meditation sessions.',    duration: '60 min' },
  { id: 4, icon: '💪', title: 'Weight Training',    desc: 'Build strength and muscle with structured weight training plans.',     duration: '75 min' },
  { id: 5, icon: '🥊', title: 'Boxing',             desc: 'High-energy boxing classes for fitness and stress relief.',           duration: '60 min' },
  { id: 6, icon: '🤸', title: 'Group Classes',      desc: 'Fun and motivating group workout sessions for all fitness levels.',   duration: '50 min' },
]

export default function Services() {
  const [services, setServices] = useState(FALLBACK)

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => { if (d.success) setServices(d.data) })
      .catch(() => {})
  }, [])

  return (
    <section id="services" className="services">
      <div className="services__inner">
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">Everything you need to reach your fitness goals</p>
        <div className="services__grid">
          {services.map(s => (
            <div key={s.id} className="services__card">
              <div className="services__card-icon">{s.icon}</div>
              <h3 className="services__card-title">{s.title}</h3>
              <p className="services__card-desc">{s.desc}</p>
              <span className="services__card-duration">⏱ {s.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
