import React, { useState, useEffect } from 'react'
import { Share2, Lock, Globe, ShieldCheck, Plus, X, Send, Loader2, CheckCircle, Clock, Users, MapPin, Tag } from 'lucide-react'
import { api } from '../services/api'

// ─── Propose Task Modal ────────────────────────────────────────────────────
const ProposeTaskModal = ({ onClose, onSubmit, submitting, error }) => {
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    type: '', priority: 'Medium', partnerOrg: '', volunteersNeeded: 1
  })

  const taskTypes = ['Medical Aid', 'Food Distribution', 'Water Supply', 'Shelter Setup', 'Search & Rescue', 'Logistics', 'Counselling', 'Other']
  const priorities = ['Low', 'Medium', 'High', 'Critical']

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.location.trim() || !form.type) return
    onSubmit(form)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#16a34a' }}>🤝 Propose Joint Task</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Create a cross-NGO collaboration task
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Task Title */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Task Title *</label>
            <input
              type="text" autoFocus required
              placeholder="e.g. Emergency food distribution in Sector 4"
              value={form.title} onChange={e => set('title', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Task Type *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {taskTypes.map(t => (
                <button key={t} type="button" onClick={() => set('type', t === form.type ? '' : t)}
                  style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', border: '2px solid', borderColor: form.type === t ? '#16a34a' : '#e2e8f0', background: form.type === t ? '#f0fdf4' : 'white', color: form.type === t ? '#16a34a' : '#64748b' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Priority + Volunteers row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: 'white' }}>
                {priorities.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Volunteers Needed</label>
              <input type="number" min={1} max={100} value={form.volunteersNeeded} onChange={e => set('volunteersNeeded', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Location *</label>
            <input type="text" required placeholder="e.g. Community Centre, Block B, Sector 4"
              value={form.location} onChange={e => set('location', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          {/* Partner NGO */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Partner Organisation (optional)</label>
            <input type="text" placeholder="e.g. Red Cross, UNICEF, local chapter name"
              value={form.partnerOrg} onChange={e => set('partnerOrg', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Description</label>
            <textarea placeholder="Describe the task, resources required, expected outcomes, timeline..."
              value={form.description} onChange={e => set('description', e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.82rem', background: '#fee2e2', padding: '10px 14px', borderRadius: '8px', fontWeight: '600' }}>
              ⚠️ {error}
            </p>
          )}

          <button type="submit" disabled={submitting || !form.title.trim() || !form.location.trim() || !form.type}
            className="btn btn-primary"
            style={{ background: '#16a34a', gap: '8px', justifyContent: 'center', padding: '14px' }}>
            {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            {submitting ? 'Proposing...' : 'Propose Joint Task'}
          </button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  )
}

// ─── Task Card ──────────────────────────────────────────────────────────────
const TaskCard = ({ task, onJoin, onComplete, currentUserId }) => {
  const priorityColor = { Critical: '#ef4444', High: '#f59e0b', Medium: '#2563eb', Low: '#10b981' }
  const color = priorityColor[task.priority] || '#64748b'
  const statusBg = { Open: '#dbeafe', InProgress: '#fef9c3', Completed: '#d1fae5' }
  const statusColor = { Open: '#1d4ed8', InProgress: '#a16207', Completed: '#065f46' }

  return (
    <div className="card" style={{ borderTop: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', color, background: `${color}18`, textTransform: 'uppercase' }}>{task.priority}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', color: statusColor[task.status] || '#64748b', background: statusBg[task.status] || '#f1f5f9' }}>{task.status}</span>
            {task.type && <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>{task.type}</span>}
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', lineHeight: 1.3 }}>{task.title}</h3>
          {task.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>{task.description}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
          <MapPin size={12} /> {task.location}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
          <Users size={12} /> {task.volunteersNeeded} volunteer{task.volunteersNeeded !== 1 ? 's' : ''} needed
          {task.partnerOrg && <> · <Share2 size={12} /> {task.partnerOrg}</>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
          <Tag size={12} /> Proposed by: <strong>{task.ngo?.organization || task.ngo?.name || 'NGO'}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        {task.status === 'Open' && (
          <button onClick={() => onJoin(task.id)} className="btn btn-primary" style={{ flex: 1, gap: '6px', justifyContent: 'center', padding: '10px' }}>
            <Users size={14} /> Join Task
          </button>
        )}
        {task.status === 'InProgress' && task.volunteerId === currentUserId && (
          <button onClick={() => onComplete(task.id)} className="btn btn-outline" style={{ flex: 1, gap: '6px', justifyContent: 'center', padding: '10px', borderColor: '#10b981', color: '#10b981' }}>
            <CheckCircle size={14} /> Mark Complete
          </button>
        )}
        {task.status === 'Completed' && (
          <div style={{ flex: 1, textAlign: 'center', color: '#10b981', fontWeight: '700', fontSize: '0.85rem', padding: '10px', background: '#f0fdf4', borderRadius: '8px' }}>
            ✓ Completed
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main CollaborationHub ─────────────────────────────────────────────────
const CollaborationHub = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [filter, setFilter] = useState('All')
  const [transparency, setTransparency] = useState({ needs: 'public', stats: 'partners', volunteers: 'private' })
  const user = JSON.parse(localStorage.getItem('unitypulse_user'))

  const fetchTasks = async () => {
    const data = await api.getTasks()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchTasks() }, [])

  const handlePropose = async (form) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      if (!user?.id) throw new Error('You must be logged in.')
      const res = await api.createTask({ ...form, ngoId: user.id })
      if (res.error) throw new Error(res.error)
      setShowModal(false)
      fetchTasks()
    } catch (err) {
      setSubmitError(err.message || 'Failed to create task.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (taskId) => {
    if (!user?.id) return alert('You must be logged in.')
    await api.joinTask(taskId, user.id)
    fetchTasks()
  }

  const handleComplete = async (taskId) => {
    await api.completeTask(taskId)
    fetchTasks()
  }

  const filters = ['All', 'Open', 'InProgress', 'Completed']
  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>NGO Bridge</h1>
          <p style={{ color: 'var(--text-muted)' }}>Propose and join cross-organisation collaboration tasks.</p>
        </div>
        <button onClick={() => { setSubmitError(''); setShowModal(true) }} className="btn btn-primary" style={{ background: '#16a34a', gap: '8px' }}>
          <Plus size={18} /> Propose Joint Task
        </button>
      </header>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: filter === f ? 'white' : 'transparent', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', color: filter === f ? '#0f172a' : '#64748b', boxShadow: filter === f ? '0 2px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
            {f} {f !== 'All' && <span style={{ marginLeft: '4px', background: filter === f ? '#e2e8f0' : 'transparent', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem' }}>{tasks.filter(t => t.status === f).length}</span>}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Share2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: '600' }}>No joint tasks yet.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Click <strong>Propose Joint Task</strong> to start collaborating.</p>
            </div>
          ) : filtered.map(task => (
            <TaskCard key={task.id} task={task} onJoin={handleJoin} onComplete={handleComplete} currentUserId={user?.id} />
          ))}
        </div>

        {/* Data Governance panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Lock size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Data Governance</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { key: 'needs', label: 'Field Survey Data', desc: 'Raw field reports' },
              { key: 'stats', label: 'Impact Statistics', desc: 'Aggregated progress' },
              { key: 'volunteers', label: 'Volunteer Roster', desc: 'Skill-based capacity' }
            ].map(item => (
              <div key={item.key}>
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.label}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
                <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                  {['Private', 'Partners', 'Public'].map(level => (
                    <button key={level}
                      onClick={() => setTransparency({ ...transparency, [item.key]: level.toLowerCase() })}
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: transparency[item.key] === level.toLowerCase() ? 'white' : 'transparent', color: transparency[item.key] === level.toLowerCase() ? '#0f172a' : '#64748b', boxShadow: transparency[item.key] === level.toLowerCase() ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '24px', padding: '14px', background: '#f8fafc', borderRadius: '10px', display: 'flex', gap: '10px' }}>
            <Globe size={16} color="#64748b" style={{ marginTop: '2px', flexShrink: 0 }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <strong>Public</strong> data is shared with the Global Community Map to help other humanitarian actors coordinate relief efforts.
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <ProposeTaskModal
          onClose={() => { setShowModal(false); setSubmitError('') }}
          onSubmit={handlePropose}
          submitting={submitting}
          error={submitError}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  )
}

export default CollaborationHub
