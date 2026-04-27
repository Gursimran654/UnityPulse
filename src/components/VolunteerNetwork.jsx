import React, { useState, useEffect } from 'react'
import { Users, Star, Award, TrendingUp, Search, Filter, ShieldCheck, Loader2 } from 'lucide-react'
import { api } from '../services/api'

const VolunteerNetwork = () => {
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [scoringUser, setScoringUser] = useState(null)

  const fetchData = async () => {
    const data = await api.getVolunteers()
    setVolunteers(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleScoreUpdate = async (id, newScore) => {
    await api.updateVolunteerScore(id, newScore)
    setScoringUser(null)
    fetchData()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="spin" size={48} color="var(--primary)" /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Volunteer Network</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage verified responders and update efficiency scores.</p>
      </header>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Volunteer</th>
              <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Efficiency</th>
              <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: '700' }}>{v.name[0]}</div>
                    <div>
                      <p style={{ fontWeight: '700' }}>{v.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.tasksCompleted} tasks</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ fontWeight: '800', color: v.efficiency >= 90 ? '#10b981' : '#2563eb' }}>{v.efficiency}%</span>
                </td>
                <td style={{ padding: '20px 24px' }}><span className="status status-success">Active</span></td>
                <td style={{ padding: '20px 24px' }}>
                  <button onClick={() => setScoringUser(v)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Update Score</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scoringUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyCenter: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '8px' }}>Score Efficiency</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Update <strong>{scoringUser.name}</strong>'s score.</p>
            <input type="range" min="50" max="100" defaultValue={scoringUser.efficiency} id="scoreRange" style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setScoringUser(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => handleScoreUpdate(scoringUser.id, document.getElementById('scoreRange').value)} className="btn btn-primary" style={{ flex: 1 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
    </div>
  )
}

export default VolunteerNetwork
