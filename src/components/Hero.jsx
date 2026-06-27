function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero__content">
        <span className="hero__tag">No. 1 Fitness Center</span>

        <h1 className="hero__title">
          Transform Your<br />
          <span>Body & Mind</span>
        </h1>

        <p className="hero__subtitle">
          Join GymFit and unlock your full potential with expert trainers,
          world-class equipment, and a community that pushes you to be your best.
        </p>

        <div className="hero__actions">
          <a href="#membership" className="btn-primary"
            onClick={e => { e.preventDefault(); scrollTo('membership') }}>Start Today</a>
          <a href="#services" className="btn-outline"
            onClick={e => { e.preventDefault(); scrollTo('services') }}>Explore Services</a>
        </div>

        <div className="hero__stats">
          {[
            { num: '500+', label: 'Happy Members' },
            { num: '20+',  label: 'Expert Trainers' },
            { num: '30+',  label: 'Fitness Classes' },
            { num: '15+',  label: 'Years Experience' },
          ].map(s => (
            <div key={s.label}>
              <div className="hero__stat-num">{s.num}</div>
              <div className="hero__stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
