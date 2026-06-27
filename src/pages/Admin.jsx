import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardPanel    from '../components/admin/DashboardPanel'
import MembersPanel      from '../components/admin/MembersPanel'
import PostsPanel        from '../components/admin/PostsPanel'
import MemberPostsPanel  from '../components/admin/MemberPostsPanel'
import ContactsPanel     from '../components/admin/ContactsPanel'
import ServicesPanel     from '../components/admin/ServicesPanel'
import TrainersPanel     from '../components/admin/TrainersPanel'
import PlansPanel        from '../components/admin/PlansPanel'
import ActivityPanel     from '../components/admin/ActivityPanel'

const NAV = [
  { id: 'dashboard',    icon: '📊', label: 'Dashboard'     },
  { id: 'members',      icon: '👥', label: 'Members'        },
  { id: 'posts',        icon: '📝', label: 'Admin Posts'    },
  { id: 'member-posts', icon: '✏️', label: 'Member Posts'   },
  { id: 'contacts',     icon: '📧', label: 'Contacts'       },
  { id: 'activity',     icon: '📋', label: 'Activity Log'   },
  { id: 'services',     icon: '🏋️', label: 'Services'       },
  { id: 'trainers',     icon: '👤', label: 'Trainers'       },
  { id: 'plans',        icon: '💳', label: 'Plans'          },
]

export default function Admin() {
  const { user, logout }        = useAuth()
  const navigate                = useNavigate()
  const [active, setActive]     = useState('dashboard')
  const [sidebarOpen, setSidebar] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="admin">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="admin__overlay" onClick={() => setSidebar(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin__sidebar${sidebarOpen ? ' admin__sidebar--open' : ''}`}>
        <div className="admin__brand">
          <span>💪</span>
          <span>GymFit</span>
        </div>

        {user && (
          <div className="admin__user-info">
            <div className="admin__user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div className="admin__user-name">{user.name}</div>
              <div className="admin__user-role">Administrator</div>
            </div>
          </div>
        )}

        <div className="admin__section-label">Admin Panel</div>

        <nav className="admin__nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`admin__nav-item${active === item.id ? ' admin__nav-item--active' : ''}`}
              onClick={() => { setActive(item.id); setSidebar(false) }}
            >
              <span className="admin__nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin__sidebar-footer">
          <a href="#/" className="admin__back">
            <span>←</span> Back to Website
          </a>
          <button className="admin__logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="admin__body">
        {/* Mobile top bar */}
        <div className="admin__topbar">
          <button className="admin__mobile-toggle" onClick={() => setSidebar(o => !o)}>
            ☰
          </button>
          <span className="admin__topbar-title">
            {NAV.find(n => n.id === active)?.icon} {NAV.find(n => n.id === active)?.label}
          </span>
          <div className="admin__topbar-actions">
            <a href="#/" className="admin__topbar-back">← Site</a>
            <button className="admin__topbar-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <main className="admin__main">
          {active === 'dashboard'    && <DashboardPanel />}
          {active === 'members'      && <MembersPanel />}
          {active === 'posts'        && <PostsPanel />}
          {active === 'member-posts' && <MemberPostsPanel />}
          {active === 'contacts'     && <ContactsPanel />}
          {active === 'activity'     && <ActivityPanel />}
          {active === 'services'     && <ServicesPanel />}
          {active === 'trainers'     && <TrainersPanel />}
          {active === 'plans'        && <PlansPanel />}
        </main>
      </div>
    </div>
  )
}
