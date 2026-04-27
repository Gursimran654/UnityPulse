import React, { useState, useEffect, useCallback } from 'react'
import { User, XCircle, Zap, ShieldAlert, Loader2, Save, CheckCircle, MapPin, Bell, Navigation, AlertTriangle, Star } from 'lucide-react'
import { api } from '../services/api'
import { useGeolocation } from '../hooks/useGeolocation'

// ─── Proximity Dispatch Banner ───────────────────────────────────────────────
const DispatchBanner = ({ hazard, onAccept, onReject, radiusKm }) => {
  const sevColor = { Critical: '#ef4444', Severe: '#f59e0b', Moderate: '#2563eb', Unverified: '#64748b' }
  const color = sevColor[hazard.severity] || '#64748b'

  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}15, ${color}08)`,
      border: `2px solid ${color}`,
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      animation: 'pulseIn 0.5s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: `${color}20`, color }}>
            <Bell size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color, letterSpacing: '0.05em' }}>
              🚨 Nearby Crisis — {hazard.distanceKm.toFixed(1)} km away
            </p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '4px' }}>{hazard.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#64748b', fontSize: '0.8rem' }}>
              <MapPin size={13} /> {hazard.location}
            </div>
          </div>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', background: `${color}20`, color, whiteSpace: 'nowrap' }}>
          {hazard.severity}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#475569' }}>
        AI matched you based on your proximity ({hazard.distanceKm.toFixed(1)} km) and skill profile. Search radius: <strong>{radiusKm} km</strong>.
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onReject}
          className="btn btn-outline"
          style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444', gap: '8px' }}
        >
          <XCircle size={16} /> Reject — Expand Radius
        </button>
        <button
          onClick={() => onAccept(hazard)}
          className="btn btn-primary"
          style={{ flex: 2, gap: '8px', background: color }}
        >
          <Navigation size={16} /> Accept & Respond
        </button>
      </div>
    </div>
  )
}

// ─── Main VolunteerPortal ─────────────────────────────────────────────────────
const VolunteerPortal = ({ activeTab }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('unitypulse_user')))
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSkills, setSelectedSkills] = useState(user?.skills ? user.skills.split(',') : [])
  const [savingSkills, setSavingSkills] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Dispatch state
  const [nearbyHazards, setNearbyHazards] = useState([])
  const [dispatchRadius, setDispatchRadius] = useState(10)
  const [dispatchStage, setDispatchStage] = useState('idle') // idle | searching | found | expanding | accepted | no_nearby
  const [activeDispatch, setActiveDispatch] = useState(null)
  const [rejectedIds, setRejectedIds] = useState([])

  const geo = useGeolocation()
  const availableSkills = ['Medical', 'Logistics', 'IT', 'Teaching', 'Construction', 'First Aid', 'Translation', 'Food Prep']

  // Push volunteer's GPS to the backend once available
  useEffect(() => {
    if (geo.lat && user) {
      api.updateVolunteerLocation(user.id, geo.lat, geo.lng)
    }
  }, [geo.lat, geo.lng])

  // Run proximity search whenever GPS or radius changes
  useEffect(() => {
    if (!geo.lat) return
    runProximitySearch(geo.lat, geo.lng, dispatchRadius)
  }, [geo.lat, geo.lng, dispatchRadius])

  const runProximitySearch = async (lat, lng, radius) => {
    setDispatchStage('searching')
    const hazards = await api.getNearbyHazards(lat, lng, radius)
    const filtered = hazards.filter(h => !rejectedIds.includes(h.id))
    if (filtered.length > 0) {
      setNearbyHazards(filtered)
      setActiveDispatch(filtered[0])
      setDispatchStage('found')
    } else {
      setNearbyHazards([])
      setActiveDispatch(null)
      setDispatchStage('no_nearby')
    }
  }

  useEffect(() => {
    api.getTasks().then(data => { setTasks(data); setLoading(false) })
  }, [])

  const handleAccept = async (hazard) => {
    await api.acceptDispatch(hazard.id, user.id)
    const updated = { ...user, tasksCompleted: (user.tasksCompleted || 0) + 1, impactHours: (user.impactHours || 0) + 3 }
    localStorage.setItem('unitypulse_user', JSON.stringify(updated))
    setUser(updated)
    setDispatchStage('accepted')
    setActiveDispatch(hazard)
  }

  const handleComplete = async () => {
    if (!activeDispatch) return
    await api.completeDispatch(activeDispatch.id, user.id)
    const updated = { ...user, efficiency: Math.min(100, parseFloat((user.efficiency + 0.5).toFixed(1))) }
    localStorage.setItem('unitypulse_user', JSON.stringify(updated))
    setUser(updated)
    setDispatchStage('completed')
    // Re-scan after completing
    setTimeout(() => {
      setActiveDispatch(null)
      setDispatchStage('idle')
      if (geo.lat) runProximitySearch(geo.lat, geo.lng, dispatchRadius)
    }, 3000)
  }

  const handleReject = () => {
    if (activeDispatch) setRejectedIds(prev => [...prev, activeDispatch.id])
    const nextRadius = dispatchRadius === 10 ? 25 : dispatchRadius === 25 ? 50 : 100
    setDispatchRadius(nextRadius)
    setDispatchStage('expanding')
    setTimeout(() => {
      if (geo.lat) runProximitySearch(geo.lat, geo.lng, nextRadius)
    }, 800)
  }

  const toggleSkill = (skill) => { setSelectedSkills(s => s.includes(skill) ? s.filter(x => x !== skill) : [...s, skill]); setSaveSuccess(false) }

  const saveSkills = async () => {
    setSavingSkills(true)
    const updated = await api.updateVolunteerSkills(user.id, selectedSkills.join(','))
    localStorage.setItem('unitypulse_user', JSON.stringify(updated))
    setUser(updated); setSavingSkills(false); setSaveSuccess(true)
  }

  // ── Sub-views ──────────────────────────────────────────────────────────────
  const ImpactView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-gradient)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white' }}>{user.name[0]}</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Field Responder</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #e2e8f0', paddingTop: '20px', gap: '8px' }}>
            <div><p style={{ fontSize: '1.4rem', fontWeight: '800', color: user.efficiency >= 90 ? '#10b981' : '#f59e0b' }}>{user.efficiency}%</p><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Efficiency</p></div>
            <div><p style={{ fontSize: '1.4rem', fontWeight: '800' }}>{user.tasksCompleted || 0}</p><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tasks</p></div>
            <div><p style={{ fontSize: '1.4rem', fontWeight: '800' }}>{user.impactHours || 0}h</p><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hours</p></div>
          </div>
        </div>
        <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ color: '#16a34a', fontWeight: '700', marginBottom: '8px' }}>GPS Status</h3>
          <p style={{ fontSize: '0.85rem', color: '#166534' }}>
            {geo.lat ? `📍 Live location detected: ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}` : '⏳ Waiting for GPS signal...'}
          </p>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#15803d' }}>
            <strong>Search radius:</strong> {dispatchRadius} km
          </div>
        </div>
      </div>

      {/* Dispatch Section */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="#4f46e5" /> Proximity Dispatch
        </h3>

        {dispatchStage === 'searching' || dispatchStage === 'expanding' ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 className="spin" size={36} color="var(--primary)" />
            <p style={{ marginTop: '16px', fontWeight: '600' }}>
              {dispatchStage === 'expanding' ? `Expanding radius to ${dispatchRadius} km...` : 'Scanning nearby hazards...'}
            </p>
          </div>
        ) : dispatchStage === 'found' && activeDispatch ? (
          <DispatchBanner hazard={activeDispatch} onAccept={handleAccept} onReject={handleReject} radiusKm={dispatchRadius} />
        ) : dispatchStage === 'accepted' ? (
          <div className="card" style={{ background: '#eff6ff', border: '2px solid #2563eb', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Navigation size={28} color="#2563eb" />
              <div>
                <h3 style={{ color: '#1e40af', fontWeight: '800' }}>Mission Accepted!</h3>
                <p style={{ color: '#3b82f6', fontSize: '0.85rem' }}>En route to: <strong>{activeDispatch?.title}</strong></p>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#1d4ed8', marginBottom: '20px' }}>
              Once you have completed the task on-site, tap below to mark it done. This updates your efficiency score and the platform's response rate.
            </p>
            <button onClick={handleComplete} className="btn btn-primary" style={{ width: '100%', gap: '8px', background: '#10b981' }}>
              <Star size={16} /> Mark as Complete — Update Stats
            </button>
          </div>
        ) : dispatchStage === 'completed' ? (
          <div className="card" style={{ background: '#f0fdf4', border: '2px solid #10b981', textAlign: 'center', padding: '32px' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: '#16a34a', fontWeight: '800', fontSize: '1.1rem' }}>Task Complete! 🎉</h3>
            <p style={{ color: '#166534', fontSize: '0.85rem' }}>Efficiency updated. Scanning for next mission...</p>
          </div>
        ) : !geo.lat ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', border: '1px dashed #e2e8f0' }}>
            <MapPin size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: '600' }}>Enable GPS to receive nearby dispatch alerts</p>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px', border: '1px dashed #e2e8f0' }}>
            <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: '600' }}>No hazards within {dispatchRadius} km — area is clear</p>
          </div>
        )}
      </div>
    </div>
  )

  const TasksView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ border: '2px solid #2563eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={24} color="#2563eb" fill="#2563eb" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Safety Tasks</h2>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#2563eb', background: '#dbeafe', padding: '4px 10px', borderRadius: '20px' }}>
            Radius: {dispatchRadius} km
          </span>
        </div>

        {dispatchStage === 'found' && activeDispatch ? (
          <DispatchBanner hazard={activeDispatch} onAccept={handleAccept} onReject={handleReject} radiusKm={dispatchRadius} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <ShieldAlert size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No dispatch tasks in range. {!geo.lat && 'Enable GPS to activate proximity matching.'}</p>
          </div>
        )}
      </div>
    </div>
  )

  const SkillsView = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Skill Registry</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select skills to be prioritized for matching tasks.</p>
        </div>
        <button onClick={saveSkills} disabled={savingSkills} className="btn btn-primary" style={{ gap: '8px', background: saveSuccess ? '#10b981' : 'var(--primary)' }}>
          {savingSkills ? <Loader2 size={18} className="spin" /> : saveSuccess ? <CheckCircle size={18} /> : <Save size={18} />}
          {saveSuccess ? 'Saved!' : 'Save Skills'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {availableSkills.map(skill => (
          <button key={skill} onClick={() => toggleSkill(skill)} style={{
            padding: '12px 24px', borderRadius: '30px', border: '2px solid',
            borderColor: selectedSkills.includes(skill) ? 'var(--primary)' : '#e2e8f0',
            background: selectedSkills.includes(skill) ? '#eff6ff' : 'white',
            color: selectedSkills.includes(skill) ? 'var(--primary)' : '#64748b',
            cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s'
          }}>{skill}</button>
        ))}
      </div>
    </div>
  )

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="spin" size={48} color="var(--primary)" /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Welcome, {user.name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {dispatchStage === 'found' ? '🚨 Active dispatch alert — please respond' : 'Standing by for nearby crisis dispatch'}
        </p>
      </header>

      {activeTab === 'tasks' ? <TasksView /> : activeTab === 'skills' ? <SkillsView /> : <ImpactView />}

      <style dangerouslySetInnerHTML={{ __html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}} />
    </div>
  )
}

export default VolunteerPortal
