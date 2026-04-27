import React, { useState, useEffect } from 'react'
import { Globe, Building2, UserCircle2, Heart, Loader2 } from 'lucide-react'
import { api } from '../services/api'

const Onboarding = ({ onSelectRole }) => {
  const [view, setView] = useState('select')
  const [role, setRole] = useState(null)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', organization: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [platformStats, setPlatformStats] = useState(null)

  useEffect(() => {
    api.getStats().then(s => setPlatformStats(s)).catch(() => {})
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (view === 'login') {
        const res = await api.login({ email: formData.email, password: formData.password })
        if (res.error) throw new Error(res.error)
        localStorage.setItem('unitypulse_token', res.token)
        localStorage.setItem('unitypulse_user', JSON.stringify(res.user))
        onSelectRole(res.user.role.toLowerCase())
      } else {
        const res = await api.register({ ...formData, role: role.toUpperCase() })
        if (res.error) throw new Error(res.error)
        setView('login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--accent-gradient)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Globe size={32} color="white" /></div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>UnityPulse</h1>
        </div>

        {view === 'select' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="card" onClick={() => { setRole('ngo'); setView('login'); }} style={{ cursor: 'pointer', padding: '40px', textAlign: 'center', border: '2px solid transparent' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ padding: '20px', borderRadius: '50%', background: '#eff6ff', color: 'var(--primary)', width: 'fit-content', margin: '0 auto 20px' }}><Building2 size={48} /></div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>NGO Administrator</h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage dispatches and verify hazards.</p>
            </div>
            <div className="card" onClick={() => { setRole('volunteer'); setView('login'); }} style={{ cursor: 'pointer', padding: '40px', textAlign: 'center', border: '2px solid transparent' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--indigo)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ padding: '20px', borderRadius: '50%', background: '#f5f3ff', color: 'var(--indigo)', width: 'fit-content', margin: '0 auto 20px' }}><UserCircle2 size={48} /></div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Field Volunteer</h2>
              <p style={{ color: 'var(--text-muted)' }}>Join the network and help communities.</p>
            </div>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>{view === 'login' ? 'Welcome Back' : 'Join UnityPulse'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{role === 'ngo' ? 'NGO Coordination Access' : 'Volunteer Portal Access'}</p>
            
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {view === 'register' && (
                <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              )}
              {view === 'register' && role === 'ngo' && (
                <input type="text" placeholder="Organization Name" required value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              )}
              <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              
              {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
              
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
                {loading ? <Loader2 className="spin" size={20} /> : (view === 'login' ? 'Sign In' : 'Create Account')}
              </button>
              
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', marginLeft: '4px' }}>
                  {view === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
              <button type="button" onClick={() => setView('select')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>Back to role selection</button>
            </form>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          {platformStats ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Heart size={14} color="#ef4444" fill="#ef4444" />
              <strong>{platformStats.totalVolunteers}</strong> volunteer{platformStats.totalVolunteers !== 1 ? 's' : ''} registered
              &nbsp;·&nbsp; <strong>{platformStats.activeHazards}</strong> active crises
              &nbsp;·&nbsp; <strong>{platformStats.totalTasksCompleted}</strong> tasks completed
            </p>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading platform stats...</p>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
    </div>
  )
}

export default Onboarding
