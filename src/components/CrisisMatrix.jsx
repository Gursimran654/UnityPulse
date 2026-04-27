import React, { useState, useEffect } from 'react'
import { AlertTriangle, MapPin, Users, Zap, ThumbsUp, Loader2, X, Send } from 'lucide-react'
import { api } from '../services/api'
import { useGeolocation } from '../hooks/useGeolocation'

// ─── Report Form Modal ──────────────────────────────────────────────────────
const ReportModal = ({ onClose, onSubmit, userLocation, submitting, error }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('')

  const crisisTypes = [
    'Flash Flood', 'Wildfire', 'Earthquake', 'Medical Emergency',
    'Food Shortage', 'Shelter Crisis', 'Landslide', 'Severe Weather', 'Other'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim(), type })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#b91c1c' }}>🚨 Report a Crisis</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {userLocation.lat
                ? `📍 GPS: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                : '⚠️ GPS not detected — report will be tagged as manual'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Crisis Name */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Crisis Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Flooding near Main Street Bridge"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Crisis Type */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
              Crisis Type
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {crisisTypes.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t === type ? '' : t)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600',
                    cursor: 'pointer', border: '2px solid',
                    borderColor: type === t ? '#2563eb' : '#e2e8f0',
                    background: type === t ? '#eff6ff' : 'white',
                    color: type === t ? '#2563eb' : '#64748b'
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              placeholder="Describe conditions — number of people affected, access routes, hazard scale, etc."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.82rem', background: '#fee2e2', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', margin: 0 }}>
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="btn btn-primary"
            style={{ background: '#ef4444', gap: '8px', justifyContent: 'center', padding: '14px' }}
          >
            {submitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            {submitting ? 'Submitting...' : 'Submit Crisis Report'}
          </button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  )
}

// ─── Crisis Card ────────────────────────────────────────────────────────────
const CrisisCard = ({ hazard, onReport }) => {
  const [loading, setLoading] = useState(false)
  const sevColor = { Critical: '#ef4444', Severe: '#f59e0b', Moderate: '#2563eb', Unverified: '#64748b' }
  const color = sevColor[hazard.severity] || '#64748b'

  const handleReport = async () => {
    setLoading(true)
    await onReport(hazard.id)
    setLoading(false)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', color, background: `${color}18`, textTransform: 'uppercase' }}>
              {hazard.severity}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.75rem' }}>
              <MapPin size={11} /> {hazard.location}
            </div>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', lineHeight: 1.3 }}>{hazard.title}</h3>
          {hazard.description && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              {hazard.description}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color, fontSize: '0.82rem', fontWeight: '700' }}>
            <Users size={13} /> {hazard.reportsCount}
          </div>
          <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Reports</p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', marginBottom: '4px' }}>
          <Zap size={14} />
          <span style={{ fontWeight: '700', fontSize: '0.78rem' }}>AI Adaptive Response</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
          {hazard.reportsCount < 2
            ? 'Awaiting verification — confirm if you can see this hazard.'
            : hazard.reportsCount < 5
            ? 'Gaining consensus. Severity escalates with more reports.'
            : 'Verified by community. Relief teams on standby.'}
        </p>
      </div>

      <button onClick={handleReport} disabled={loading} className="btn btn-outline" style={{ gap: '6px', justifyContent: 'center' }}>
        {loading ? <Loader2 size={15} className="spin" /> : <ThumbsUp size={15} />}
        Verify via GPS
      </button>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────
const CrisisMatrix = () => {
  const [hazards, setHazards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const userLocation = useGeolocation()

  const fetchData = async () => {
    const data = await api.getHazards()
    setHazards(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleVerify = async (hazardId) => {
    const user = JSON.parse(localStorage.getItem('unitypulse_user'))
    if (!user?.id) return
    await api.reportHazard(hazardId, user.id)
    fetchData()
  }

  const handleSubmitReport = async ({ title, description, type }) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const user = JSON.parse(localStorage.getItem('unitypulse_user'))
      if (!user?.id) throw new Error('You must be logged in to report a crisis.')
      const fullTitle = type ? `${type}: ${title}` : title
      const res = await api.createHazard({
        title: fullTitle,
        description: description || null,
        location: userLocation.lat
          ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
          : 'Manually Reported',
        userId: user.id,
        lat: userLocation.lat,
        lng: userLocation.lng
      })
      if (res.error) throw new Error(res.error)
      setShowModal(false)
      setSubmitError('')
      fetchData()
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px' }}>
      <Loader2 size={48} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Crisis Matrix</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {userLocation.lat
              ? <span style={{ color: '#10b981', fontWeight: '600' }}>● GPS Active — {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
              : 'Enable location access in your browser for GPS tagging'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '6px 14px', borderRadius: '20px', fontWeight: '600' }}>
            {hazards.filter(h => h.status === 'Active').length} Active
          </span>
          <button
            onClick={() => { setSubmitError(''); setShowModal(true) }}
            className="btn btn-primary"
            style={{ background: '#ef4444', gap: '8px' }}
          >
            <AlertTriangle size={16} /> Report Crisis
          </button>
        </div>
      </header>

      {hazards.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <AlertTriangle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: '600' }}>No active crises reported — all clear.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Spotted something? Click <strong>Report Crisis</strong> above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {hazards.map(hazard => (
            <CrisisCard key={hazard.id} hazard={hazard} onReport={handleVerify} />
          ))}
        </div>
      )}

      {showModal && (
        <ReportModal
          onClose={() => { setShowModal(false); setSubmitError('') }}
          onSubmit={handleSubmitReport}
          userLocation={userLocation}
          submitting={submitting}
          error={submitError}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  )
}

export default CrisisMatrix
