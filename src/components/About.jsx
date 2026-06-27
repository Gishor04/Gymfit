const STATS = [
  { icon: '🏅', value: '500+', label: 'Happy Members' },
  { icon: '🏆', value: '20+',  label: 'Expert Trainers' },
  { icon: '📅', value: '15+',  label: 'Years Experience' },
  { icon: '🎯', value: '30+',  label: 'Fitness Classes' },
]

export default function About() {
  return (
    <section id="about" className="about">
      <div className="about__inner">
        <h2 className="section-title">About Our Gym</h2>
        <p className="section-subtitle">
          GymFit provides modern equipment, certified trainers, and personalized
          fitness programs designed to help you achieve your health goals — faster.
        </p>
        <p className="about__text">
          Founded in 2010, GymFit has grown into one of the region's most trusted
          fitness destinations. We believe fitness is for everyone — from first-time
          gym-goers to seasoned athletes. Our state-of-the-art facility and passionate
          coaching staff are here to guide you every step of the way.
        </p>

        <div className="about__grid">
          {STATS.map(s => (
            <div key={s.label} className="about__card">
              <div className="about__card-icon">{s.icon}</div>
              <div className="about__card-num">{s.value}</div>
              <div className="about__card-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
