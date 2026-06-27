import { useState, useEffect } from 'react'

const FALLBACK = [
  {
    id: 1, name: 'Basic', price: 29, popular: false,
    features: ['Gym Access (Mon–Fri)', 'Locker Room', '2 Group Classes/month', 'Basic Equipment', 'App Access'],
  },
  {
    id: 2, name: 'Pro', price: 59, popular: true,
    features: ['Unlimited Gym Access', 'All Group Classes', '2 Personal Sessions/month', 'Nutrition Guide', 'App Access', 'Guest Pass (2/month)'],
  },
  {
    id: 3, name: 'Elite', price: 99, popular: false,
    features: ['Everything in Pro', 'Unlimited Personal Training', 'Meal Planning', 'Priority Booking', 'Unlimited Guest Passes', 'Recovery Room Access'],
  },
]

export default function Membership() {
  const [plans, setPlans] = useState(FALLBACK)

  useEffect(() => {
    fetch('/api/membership')
      .then(r => r.json())
      .then(d => { if (d.success) setPlans(d.data) })
      .catch(() => {})
  }, [])

  return (
    <section id="membership" className="membership">
      <div className="membership__inner">
        <h2 className="section-title">Membership Plans</h2>
        <p className="section-subtitle">Choose the plan that fits your lifestyle and budget</p>
        <div className="membership__grid">
          {plans.map(p => (
            <div
              key={p.id}
              className={`membership__card${p.popular ? ' membership__card--popular' : ''}`}
            >
              {p.popular && <div className="membership__badge">Most Popular</div>}
              <h3 className="membership__name">{p.name}</h3>
              <div className="membership__price">
                <span className="membership__currency">$</span>
                <span className="membership__amount">{p.price}</span>
                <span className="membership__period">/mo</span>
              </div>
              <ul className="membership__features">
                {p.features.map(f => (
                  <li key={f} className="membership__feature">
                    <span>✅</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`membership__btn${p.popular ? ' membership__btn--popular' : ''}`}
                onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
