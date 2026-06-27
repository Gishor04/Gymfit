const year = new Date().getFullYear()

const QUICK_LINKS = [
  { label: 'Home',       id: 'home'       },
  { label: 'About',      id: 'about'      },
  { label: 'Services',   id: 'services'   },
  { label: 'Membership', id: 'membership' },
  { label: 'Trainers',   id: 'trainers'   },
  { label: 'Contact',    id: 'contact'    },
]

const SERVICES = [
  'Personal Training', 'Cardio Training', 'Yoga Classes',
  'Weight Training', 'Boxing', 'Group Classes',
]

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SLink({ id, children, className }) {
  return (
    <a
      href={`#${id}`}
      className={className}
      onClick={e => { e.preventDefault(); scrollTo(id) }}
    >
      {children}
    </a>
  )
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div>
            <div className="footer__brand-logo">💪 GymFit</div>
            <p className="footer__brand-desc">
              Your premier fitness destination since 2010. We&apos;re committed to
              helping you transform your body and achieve your health goals.
            </p>
          </div>

          <div className="footer__col">
            <h4>Quick Links</h4>
            <ul>
              {QUICK_LINKS.map(({ label, id }) => (
                <li key={id}><SLink id={id}>{label}</SLink></li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h4>Services</h4>
            <ul>
              {SERVICES.map(s => (
                <li key={s}><SLink id="services">{s}</SLink></li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h4>Contact</h4>
            <ul>
              <li><SLink id="contact">📍 Neervely South, Neervely</SLink></li>
              <li><a href="tel:+94788590402">📞 +94 78 859 0402</a></li>
              <li><a href="mailto:rajangishor04@gmail.com">📧 rajangishor04@gmail.com</a></li>
              <li><SLink id="contact">🕐 Mon–Fri: 6:00 AM – 10:00 PM</SLink></li>
              <li><SLink id="contact">🕐 Sat–Sun: 8:00 AM – 8:00 PM</SLink></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">© {year} GymFit. All rights reserved.</p>
          <div className="footer__links">
            <SLink id="home">Privacy Policy</SLink>
            <SLink id="home">Terms of Service</SLink>
            <SLink id="home">Cookie Policy</SLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
