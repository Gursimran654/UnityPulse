import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  ClipboardList, 
  Share2, 
  Bell, 
  Menu,
  X,
  Globe,
  Heart,
  LogOut,
  Target,
  Activity,
  Zap
} from 'lucide-react'
import Dashboard from './components/Dashboard'
import VolunteerPortal from './components/VolunteerPortal'
import CrisisMatrix from './components/CrisisMatrix'
import CollaborationHub from './components/CollaborationHub'
import SurveyBuilder from './components/SurveyBuilder'
import Onboarding from './components/Onboarding'
import VolunteerNetwork from './components/VolunteerNetwork'
import { api } from './services/api'

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('unitypulse_role'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('unitypulse_user')))
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [globalStats, setGlobalStats] = useState(null)
  const [notifications, setNotifications] = useState([])

  // Load real global stats on mount and every 30s
  useEffect(() => {
    if (!userRole) return
    const load = async () => {
      try {
        const s = await api.getStats()
        setGlobalStats(s)
        // Auto-generate notifications for critical hazards
        if (s.criticalHazards > 0) {
          setNotifications([{ id: 1, text: `${s.criticalHazards} critical hazard${s.criticalHazards > 1 ? 's' : ''} need immediate response` }])
        }
      } catch {}
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [userRole])

  // Sync user from localStorage whenever it changes (e.g. after task completion)
  useEffect(() => {
    const syncUser = () => {
      const fresh = JSON.parse(localStorage.getItem('unitypulse_user'))
      if (fresh) setUser(fresh)
    }
    window.addEventListener('storage', syncUser)
    // Also poll every 5s to catch same-tab updates
    const t = setInterval(syncUser, 5000)
    return () => { window.removeEventListener('storage', syncUser); clearInterval(t) }
  }, [])

  const handleSelectRole = (role) => {
    const updatedUser = JSON.parse(localStorage.getItem('unitypulse_user'))
    setUser(updatedUser)
    localStorage.setItem('unitypulse_role', role)
    setUserRole(role)
    setActiveTab('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('unitypulse_role')
    localStorage.removeItem('unitypulse_token')
    localStorage.removeItem('unitypulse_user')
    setUserRole(null)
    setUser(null)
    setGlobalStats(null)
  }

  if (!userRole) return <Onboarding onSelectRole={handleSelectRole} />

  const navItems = userRole === 'ngo' ? [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Impact Dashboard' },
    { id: 'crises', icon: AlertTriangle, label: 'Crisis Matrix' },
    { id: 'volunteers', icon: Users, label: 'Volunteer Network' },
    { id: 'surveys', icon: ClipboardList, label: 'Field Surveys' },
    { id: 'collaboration', icon: Share2, label: 'NGO Bridge' }
  ] : [
    { id: 'dashboard', icon: LayoutDashboard, label: 'My Impact' },
    { id: 'tasks', icon: AlertTriangle, label: 'Safety Tasks' },
    { id: 'skills', icon: Target, label: 'My Skills' }
  ]

  const renderContent = () => {
    if (userRole === 'volunteer') return <VolunteerPortal activeTab={activeTab} />
    switch(activeTab) {
      case 'dashboard': return <Dashboard />
      case 'volunteers': return <VolunteerNetwork />
      case 'crises': return <CrisisMatrix />
      case 'surveys': return <SurveyBuilder />
      case 'collaboration': return <CollaborationHub />
      default: return <Dashboard />
    }
  }

  const SidebarContent = () => (
    <>
      <div className="logo" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--accent-gradient)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
          <Globe size={24} color="white" />
        </div>
        <div>
          <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', lineHeight: 1.1 }}>UnityPulse</h2>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {userRole === 'ngo' ? 'NGO Coordination' : 'Volunteer Portal'}
          </span>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false) }}
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', position: 'relative' }}
          >
            <item.icon size={20} />
            {item.label}
            {/* Badge for active crises on Crisis Matrix nav */}
            {item.id === 'crises' && globalStats?.activeHazards > 0 && (
              <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: '800', padding: '2px 7px', borderRadius: '10px' }}>
                {globalStats.activeHazards}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Real-time sidebar stats */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} color="#10b981" />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>Platform Activity</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Volunteers', val: globalStats?.totalVolunteers ?? '…' },
              { label: 'Active Crises', val: globalStats?.activeHazards ?? '…' },
              { label: 'Tasks Done', val: globalStats?.totalTasksCompleted ?? '…' },
              { label: 'Response', val: globalStats ? `${globalStats.responseRate}%` : '…' }
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1rem', fontWeight: '800', color: 'white' }}>{val}</p>
                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.9rem', borderRadius: '8px' }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
        >
          <LogOut size={18} /> Exit Platform
        </button>
      </div>
    </>
  )

  return (
    <div className="app-layout">
      <aside className="sidebar"><SidebarContent /></aside>

      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />}
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><X size={24} /></button>
        </div>
        <SidebarContent />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="top-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="lg-hidden" onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'transparent', border: 'none' }}><Menu size={24} /></button>
            {/* Active crisis count pill */}
            {globalStats?.activeHazards > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>
                <AlertTriangle size={13} /> {globalStats.activeHazards} Active
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* System status */}
            <div className="stats-badge desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
              <div style={{ width: '6px', height: '6px', background: '#059669', borderRadius: '50%' }}></div>
              {globalStats ? `${globalStats.responseRate}% Response Rate` : 'System Live'}
            </div>

            {/* Notifications bell */}
            <button style={{ position: 'relative', background: 'transparent', border: 'none' }}>
              <Bell size={20} color="var(--text-muted)" />
              {notifications.length > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></span>
              )}
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>

            {/* User profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }} className="desktop-only">
                <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{user?.name || 'Guest'}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {userRole === 'ngo'
                    ? (user?.organization || 'NGO Administrator')
                    : `Efficiency: ${user?.efficiency ?? 100}%`}
                </p>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {user?.name?.substring(0, 2).toUpperCase() || 'UP'}
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="animate-up">{renderContent()}</div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) { .lg-hidden { display: none !important; } }
        @media (max-width: 1023px) { .desktop-only { display: none !important; } }
      `}} />
    </div>
  )
}

export default App
