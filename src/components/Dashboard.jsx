import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, AlertCircle, Users, Activity, Upload, Heart, MapPin, Calendar, FileCheck, Loader2, FileX, Download, RefreshCw, CheckSquare, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import { useGeolocation } from '../hooks/useGeolocation'

const StatCard = ({ icon: Icon, label, value, description, color, sub }) => (
  <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
      <div style={{ padding: '10px', borderRadius: '10px', background: `${color}18`, color }}>
        <Icon size={22} />
      </div>
      <div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>{value ?? '—'}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</p>
      </div>
    </div>
    {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</p>}
  </div>
)

const Dashboard = () => {
  const [uploadState, setUploadState] = useState('idle')
  const [rejectedFile, setRejectedFile] = useState(null)
  const [needs, setNeeds] = useState([])
  const [stats, setStats] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [purging, setPurging] = useState(false)
  const [purgeResult, setPurgeResult] = useState(null)
  const fileInputRef = useRef(null)
  const userLocation = useGeolocation()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setRefreshing(true)
    const [hazards, realStats, volunteers] = await Promise.all([
      api.getHazards(),
      api.getStats(),
      api.getVolunteers()
    ])
    setNeeds(hazards.filter(h => h.status === 'Active').slice(0, 5))
    setStats(realStats)
    setRefreshing(false)
  }

  const hazardMappings = [
    { keywords: ['flood', 'water', 'rain', 'inundation', 'overflow'], title: 'Flash Flood Emergency' },
    { keywords: ['fire', 'smoke', 'burn', 'wildfire', 'blaze'], title: 'Wildfire Outbreak' },
    { keywords: ['quake', 'tremor', 'seismic', 'earthquake'], title: 'Seismic Disturbance' },
    { keywords: ['medical', 'hospital', 'health', 'clinic', 'injury', 'casualty'], title: 'Medical Supply Crisis' },
    { keywords: ['food', 'hunger', 'famine', 'ration', 'nutrition'], title: 'Food Shortage Emergency' },
    { keywords: ['shelter', 'house', 'collapse', 'homeless', 'camp', 'displaced'], title: 'Housing & Shelter Crisis' },
    { keywords: ['landslide', 'mud', 'debris', 'slope'], title: 'Landslide Warning' },
    { keywords: ['drought', 'dry', 'water_shortage'], title: 'Drought Alert' },
    { keywords: ['cyclone', 'typhoon', 'hurricane', 'storm', 'wind'], title: 'Severe Weather Event' },
    { keywords: ['survey', 'report', 'field', 'assessment', 'ngo', 'relief', 'aid', 'disaster', 'crisis', 'emergency', 'hazard'], title: 'Field Assessment Report' },
  ]

  // STRICT noise detection — uses regex + keyword blocklist
  const isNoise = (filename) => {
    const name = filename.toLowerCase()
    const noisePatterns = [
      /^screenshot[\s_-]/i,            // Windows/Mac: "Screenshot 2026-..."
      /^screen shot/i,                  // "Screen Shot ..."
      /^img_?\d{4,}/i,                  // Camera: IMG_1234
      /^dsc_?\d{4,}/i,                  // DSLR: DSC_1234
      /^dcim/i,                         // DCIM folders
      /^\d{8}_\d{6}/,                   // Timestamp: 20260425_191621
      /^\d{4}-\d{2}-\d{2}[_\s]/,       // Date prefix: 2026-04-25_...
      /^whatsapp (image|video|audio)/i, // WhatsApp exports
      /^wa\d{4}/i,                      // WA short names
      /^photo_?\d+/i,                   // Generic photo
      /^video_?\d+/i,                   // Generic video
      /^clip_?\d+/i,                    // Generic clip
      /^vlc-/i,                         // VLC snapshots
      /^snap/i,                         // Snapchat exports
      /^untitled/i,                     // Untitled files
      /^new file/i,                     // New File naming
    ]
    const noiseWords = ['meme', 'funny', 'joke', 'selfie', 'lol', 'cat', 'dog', 'pet', 'birthday', 'party', 'wedding', 'vacation', 'travel', 'food_pic', 'lunch', 'dinner']
    return noisePatterns.some(p => p.test(name)) || noiseWords.some(w => name.includes(w))
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 5) { alert("Max 5 files at once."); return }
    setUploadState('processing')

    setTimeout(async () => {
      const user = JSON.parse(localStorage.getItem('unitypulse_user'))
      for (const file of files) {
        const nameLower = file.name.toLowerCase()

        // Step 1: Hard reject all noise files
        if (isNoise(file.name)) {
          setRejectedFile(file.name)
          setUploadState('rejected')
          setTimeout(() => setUploadState('idle'), 5000)
          return
        }

        // Step 2: Try to identify a specific hazard from the filename
        const detected = hazardMappings.find(h => h.keywords.some(k => nameLower.includes(k)))

        // Step 3: If no hazard identified — also reject (strict allowlist)
        if (!detected) {
          setRejectedFile(file.name)
          setUploadState('rejected')
          setTimeout(() => setUploadState('idle'), 5000)
          return
        }

        const location = userLocation.lat
          ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
          : 'Offline Upload'
        await api.createHazard({ title: detected.title, location, userId: user.id, lat: userLocation.lat, lng: userLocation.lng })
      }
      setUploadState('success')
      fetchAll()
      setTimeout(() => setUploadState('idle'), 4000)
    }, 2000)
  }

  const handlePurge = async () => {
    if (!window.confirm(`Remove all noise records (screenshots, test data, unnamed entries) from the database?`)) return
    setPurging(true)
    setPurgeResult(null)
    const res = await api.purgeNoiseHazards()
    setPurgeResult(res.deleted)
    setPurging(false)
    fetchAll()
    setTimeout(() => setPurgeResult(null), 5000)
  }

  const exportReport = (e) => {
    e.preventDefault()
    const reportData = {
      reportName: 'UnityPulse Community Impact Report',
      generated: new Date().toISOString(),
      stats,
      activeCrises: needs.map(n => ({ title: n.title, location: n.location, severity: n.severity, reports: n.reportsCount }))
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `UnityPulse_Report_${Date.now()}.json`
    link.click()
  }

  const responseRateDisplay = stats?.responseRate != null ? `${stats.responseRate}%` : '0%'
  const impactHoursDisplay = stats?.totalImpactHours ? `${stats.totalImpactHours}h` : '0h'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Impact Overview</h1>
          <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Live data from the database
            {userLocation.lat && <span style={{ fontSize: '0.75rem', color: '#10b981' }}>• GPS Active</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {purgeResult !== null && (
            <span style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background: purgeResult > 0 ? '#fee2e2' : '#f0fdf4', color: purgeResult > 0 ? '#ef4444' : '#16a34a', borderRadius:'8px', fontSize:'0.8rem', fontWeight:'700' }}>
              {purgeResult > 0 ? `🗑 ${purgeResult} junk records removed` : '✓ Database is clean'}
            </span>
          )}
          <button onClick={handlePurge} className="btn btn-outline" disabled={purging} style={{ gap:'6px', borderColor:'#f59e0b', color:'#b45309' }}>
            {purging ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
            Purge Junk Data
          </button>
          <button onClick={fetchAll} className="btn btn-outline" disabled={refreshing} style={{ gap: '6px' }}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={exportReport} className="btn btn-primary" style={{ gap: '6px' }}>
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      {/* Real Stats Grid */}
      <div className="grid-cols-2 grid-cols-4">
        <StatCard icon={Activity} label="Total Impact Hours" value={impactHoursDisplay} color="#2563eb" sub={`${stats?.totalTasksCompleted ?? 0} tasks completed`} />
        <StatCard icon={AlertCircle} label="Active Crises" value={stats?.activeHazards ?? 0} color="#ef4444" sub={`${stats?.criticalHazards ?? 0} critical severity`} />
        <StatCard icon={Users} label="Registered Volunteers" value={stats?.totalVolunteers ?? 0} color="#10b981" sub={`Avg. efficiency: ${stats?.avgEfficiency ?? 0}%`} />
        <StatCard icon={TrendingUp} label="Response Rate" value={responseRateDisplay} color="#4f46e5" sub={`${stats?.resolvedHazards ?? 0} hazards resolved`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

        {/* Live Priority Needs */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Active Priority Needs</h2>
            <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
              {stats?.activeHazards ?? 0} Active
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {needs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <CheckSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>No active crises — all clear! 🎉</p>
              </div>
            ) : needs.map((need, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: need.severity === 'Critical' ? '#ef4444' : need.severity === 'Severe' ? '#f59e0b' : '#2563eb', marginTop: '6px', flexShrink: 0 }}></div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{need.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      <MapPin size={11} /> {need.location} • {need.reportsCount} reports
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', background: need.severity === 'Critical' ? '#fee2e2' : '#dbeafe', color: need.severity === 'Critical' ? '#ef4444' : '#2563eb', whiteSpace: 'nowrap' }}>
                  {need.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Live summary card */}
          <div className="card" style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none' }}>
            <h3 style={{ color: 'white', marginBottom: '12px' }}>Platform Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Total Reports', val: stats?.totalReports ?? 0 },
                { label: 'Resolved', val: stats?.resolvedHazards ?? 0 },
                { label: 'Volunteers', val: stats?.totalVolunteers ?? 0 },
                { label: 'Avg Efficiency', val: `${stats?.avgEfficiency ?? 0}%` }
              ].map(({ label, val }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white' }}>{val}</p>
                  <p style={{ fontSize: '0.7rem', opacity: 0.85 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Offline Data Center */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>Offline Data Center</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Upload real field docs — AI identifies hazard type, GPS tags location automatically.
            </p>
            <input type="file" ref={fileInputRef} multiple style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*,.pdf,.csv" />
            <div onClick={() => fileInputRef.current.click()} style={{ border: '2px dashed var(--border-light)', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
              {uploadState === 'processing' ? (
                <><Loader2 size={28} color="var(--primary)" className="spin" /><p style={{ marginTop: '10px', fontWeight: '600', fontSize: '0.85rem' }}>AI Mapping via GPS...</p></>
              ) : uploadState === 'rejected' ? (
                <><FileX size={28} color="#ef4444" /><p style={{ marginTop: '10px', fontWeight: '600', color: '#ef4444', fontSize: '0.85rem' }}>Rejected — Not Crisis-Relevant</p><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rejectedFile}</p></>
              ) : uploadState === 'success' ? (
                <><FileCheck size={28} color="var(--success)" /><p style={{ marginTop: '10px', fontWeight: '600', color: 'var(--success)', fontSize: '0.85rem' }}>Synced & GPS-Tagged!</p></>
              ) : (
                <><Upload size={28} color="var(--primary)" /><p style={{ marginTop: '10px', fontWeight: '600', fontSize: '0.85rem' }}>Upload Field Data</p><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max 5 files • AI Noise Filter Active</p></>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
    </div>
  )
}

export default Dashboard
