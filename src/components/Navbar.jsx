import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { label: 'Home',       id: 'home'       },
  { label: 'About',      id: 'about'      },
  { label: 'Services',   id: 'services'   },
  { label: 'Membership', id: 'membership' },
  { label: 'Trainers',   id: 'trainers'   },
  { label: 'Contact',    id: 'contact'    },
]

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (e, sectionId) => {
    e.preventDefault()
    setOpen(false)

    if (location.pathname === '/') {
      // Already on home page — just scroll
      scrollToSection(sectionId)
    } else {
      // Navigate to home first, then scroll after render
      navigate('/')
      setTimeout(() => scrollToSection(sectionId), 80)
    }
  }

  const handleLogoClick = (e) => {
    e.preventDefault()
    setOpen(false)
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
    }
  }

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <a href="#/" className="navbar__logo" onClick={handleLogoClick}>
        💪 GymFit
      </a>

      <button
        className={`navbar__burger${open ? ' navbar__burger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      <ul className={`navbar__links${open ? ' navbar__links--open' : ''}`}>
        {NAV_LINKS.map(({ label, id }) => (
          <li key={id}>
            <a
              href={`#/${id}`}
              className="navbar__link"
              onClick={(e) => handleNavClick(e, id)}
            >
              {label}
            </a>
          </li>
        ))}

        {user ? (
          <>
            {isAdmin ? (
              <li>
                <Link to="/admin" className="navbar__admin-link" onClick={() => setOpen(false)}>
                  ⚙ Admin
                </Link>
              </li>
            ) : (
              <li>
                <Link to="/dashboard" className="navbar__member-link" onClick={() => setOpen(false)}>
                  👤 {user.name?.split(' ')[0]}
                </Link>
              </li>
            )}
            <li>
              <button className="navbar__logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" className="navbar__link" onClick={() => setOpen(false)}>
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="navbar__cta-btn" onClick={() => setOpen(false)}>
                Join Now
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  )
}
