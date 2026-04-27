import React, { useState } from 'react'
import { ClipboardList, Plus, Tag, Trash2, Save, FileText, Settings2, HelpCircle } from 'lucide-react'

const SurveyBuilder = () => {
  const [questions, setQuestions] = useState([
    { id: 1, text: "Describe the current water access situation.", type: "text", tags: ["Utility", "Water"] },
    { id: 2, text: "Estimated number of displaced individuals.", type: "number", tags: ["Demographics"] }
  ])

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      text: "", 
      type: "text", 
      tags: [] 
    }])
  }

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Survey Architect</h1>
          <p style={{ color: 'var(--text-muted)' }}>Building structured field reports for better AI analysis.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline"><Settings2 size={18} /> Settings</button>
          <button className="btn btn-primary"><Save size={18} /> Publish to Field</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Editor */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Survey Title</label>
            <input 
              type="text" 
              placeholder="e.g., Post-Flood Needs Assessment (Sector 4)" 
              style={{ 
                width: '100%', 
                background: 'transparent', 
                border: 'none', 
                borderBottom: '2px solid #e2e8f0',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#0f172a',
                padding: '8px 0',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, index) => (
              <div key={q.id} style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                      {index + 1}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>Question Configuration</span>
                  </div>
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <textarea 
                  value={q.text}
                  onChange={(e) => {
                    const newQs = [...questions]
                    newQs[index].text = e.target.value
                    setQuestions(newQs)
                  }}
                  rows={2}
                  placeholder="Enter the community question..."
                  style={{ 
                    width: '100%',
                    background: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '1rem', 
                    color: '#1e293b', 
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={14} color="#64748b" />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {q.tags.map(tag => (
                          <span key={tag} style={{ 
                            fontSize: '0.7rem', 
                            background: '#f1f5f9', 
                            color: '#475569',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontWeight: '600',
                            border: '1px solid #e2e8f0'
                          }}>{tag}</span>
                        ))}
                        <button style={{ 
                          fontSize: '0.7rem', 
                          background: 'transparent', 
                          border: '1px dashed #cbd5e1', 
                          color: '#64748b',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          cursor: 'pointer'
                        }}>+ Add Tag</button>
                      </div>
                    </div>
                  </div>

                  <select style={{ 
                    background: 'white', 
                    border: '1px solid #e2e8f0', 
                    color: '#475569', 
                    fontSize: '0.85rem',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}>
                    <option>Text Response</option>
                    <option>Number (Metric)</option>
                    <option>Single Choice</option>
                    <option>GPS Location</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={addQuestion}
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '20px', borderStyle: 'dashed', gap: '8px', padding: '16px' }}
          >
            <Plus size={20} />
            Insert New Question
          </button>
        </div>

        {/* Tips & Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ background: '#f8fafc' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--primary)" />
              Survey Preview
            </h3>
            <div style={{ opacity: 0.6 }}>
              <div style={{ height: '10px', width: '80%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
              <div style={{ height: '30px', width: '100%', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '16px' }}></div>
              <div style={{ height: '10px', width: '60%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
              <div style={{ height: '30px', width: '100%', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}></div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px', textAlign: 'center' }}>
              Preview shows mobile rendering by default.
            </p>
          </div>

          <div className="card" style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#2563eb' }}>
              <HelpCircle size={20} />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>AI Guidance</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.5 }}>
              Tagged surveys allow our AI to prioritize critical needs in the **Crisis Matrix** 40% faster. Ensure every question has at least one tag.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurveyBuilder
