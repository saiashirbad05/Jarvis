import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import html2pdf from 'html2pdf.js'

// High-performance canvas-based confetti celebration component
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    // Set full screen canvas sizing
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#eb5b31']
    const particles = []

    // Spawn rich colorful particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0,
        speed: Math.random() * 3 + 2.5
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let activeParticles = 0

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental
        p.y += p.speed
        p.x += Math.sin(p.tiltAngle) * 0.6

        if (p.y < canvas.height) {
          activeParticles++
        }

        ctx.beginPath()
        ctx.lineWidth = p.r
        ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y)
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2)
        ctx.stroke()
      })

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(draw)
      }
    }

    draw()

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999
      }}
    />
  )
}

const API = 'http://127.0.0.1:8000'

const VERDICT_STYLES = {
  fair:       { bg: '#dcfce7', color: '#166534', label: 'FAIR' },
  high:       { bg: '#fef3c7', color: '#92400e', label: 'HIGH' },
  suspicious: { bg: '#fee2e2', color: '#991b1b', label: 'SUSPICIOUS' },
  low:        { bg: '#e0e7ff', color: '#3730a3', label: 'LOW' },
}

function decodeJwt(token) {
  try {
    if (!token) return null
    if (token === 'mock_developer_bypass_token') {
      return {
        email: 'developer@serviceone.dev',
        name: 'Demo Developer'
      }
    }
    if (token.startsWith('mock_user')) {
      const uNum = token.replace('mock_user', '')
      return {
        email: `user${uNum}@serviceone.dev`,
        name: `User ${uNum}`
      }
    }
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('history')
  const [history, setHistory] = useState([])
  const [customSearches, setCustomSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Custom search form
  const [newSearch, setNewSearch] = useState({ search_label: '', search_url: '', notes: '' })
  const [addingSearch, setAddingSearch] = useState(false)

  // Expanded row
  const [expandedId, setExpandedId] = useState(null)

  // Community Reports and Submission
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalForm, setModalForm] = useState({ city: '', area: '', appliance: 'AC', service_type: 'Installation', provider_name: '', quoted_price: '', notes: '' })
  const [proofFile, setProofFile] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [proofImageUrl, setProofImageUrl] = useState('')

  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (history.length > 0) {
      const savings = history.reduce((acc, item) => {
        return acc + (item.potential_savings > 0 ? Number(item.potential_savings) : 0)
      }, 0)
      if (savings > 0) {
        setShowConfetti(true)
        // Auto-turn off confetti after 4.5 seconds to avoid battery drainage
        const timer = setTimeout(() => setShowConfetti(false), 4500)
        return () => clearTimeout(timer)
      }
    }
  }, [history])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const decoded = decodeJwt(token)
    if (decoded) {
      setCurrentUser(decoded)
      fetchData(decoded.email)
    } else {
      fetchData()
    }
  }, [navigate])

  const fetchData = async (email = null) => {
    setLoading(true)
    setError(null)
    try {
      const emailParam = email ? `&email=${encodeURIComponent(email)}` : ''
      const [histRes, customRes] = await Promise.all([
        fetch(`${API}/api/history?limit=50${emailParam}`),
        fetch(`${API}/api/custom-searches?limit=50${emailParam}`),
      ])
      
      if (histRes.ok) {
        const hData = await histRes.json()
        setHistory(hData.history || [])
      }
      if (customRes.ok) {
        const cData = await customRes.json()
        setCustomSearches(cData.searches || [])
      }

      if (email) {
        setReportsLoading(true)
        const repRes = await fetch(`${API}/api/user-reports?email=${encodeURIComponent(email)}`)
        if (repRes.ok) {
          const rData = await repRes.json()
          setReports(rData.reports || [])
        }
        setReportsLoading(false)
      }
    } catch (err) {
      setError('Unable to connect to the server. Make sure the backend is running.')
    }
    setLoading(false)
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProofFile(file)
    setImagePreview(URL.createObjectURL(file))
    
    // Upload image instantly to backend
    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch(`${API}/api/upload-proof`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        setProofImageUrl(data.url)
      } else {
        console.error('Proof image upload failed')
      }
    } catch (err) {
      console.error('Image upload endpoint error:', err)
    } finally {
      setUploadingImage(false)
    }
  }

  const submitCommunityReport = async (e) => {
    e.preventDefault()
    if (!modalForm.city.trim() || !modalForm.quoted_price) return
    
    try {
      const payload = {
        ...modalForm,
        quoted_price: Number(modalForm.quoted_price),
        user_email: currentUser?.email || null,
        user_name: currentUser?.name || null,
        proof_image_url: proofImageUrl || null
      }
      
      const res = await fetch(`${API}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setShowModal(false)
        setModalForm({ city: '', area: '', appliance: 'AC', service_type: 'Installation', provider_name: '', quoted_price: '', notes: '' })
        setProofFile(null)
        setImagePreview(null)
        setProofImageUrl('')
        fetchData(currentUser?.email)
      }
    } catch (err) {
      console.error('Community report submission error:', err)
    }
  }

  const downloadPDFReport = (item) => {
    const resultData = item.full_result_json || {}
    const vs = VERDICT_STYLES[item.verdict] || VERDICT_STYLES.fair
    
    const element = document.createElement('div')
    element.style.padding = '40px'
    element.style.fontFamily = "'Outfit', sans-serif"
    element.style.color = '#1e293b'
    element.style.backgroundColor = '#fcfbf8'
    element.style.width = '700px'
    element.style.margin = '0 auto'
    element.style.boxSizing = 'border-box'
    
    element.innerHTML = `
      <div style="border: 2px solid #1c446b; padding: 30px; border-radius: 20px; background-color: #ffffff; position: relative; overflow: hidden;">
        <!-- Header Accent -->
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 10px; background-color: #1c446b;"></div>
        
        <!-- Logo and Organization -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #1c446b; margin: 0; display: flex; align-items: center; gap: 8px;">
              🛡️ ServiceOne
            </h1>
            <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Official Fairness Diagnostic Certificate</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700;">DATE ISSUED</div>
            <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px;">\${new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
        
        <!-- Certificate Body -->
        <div style="margin-bottom: 25px;">
          <span style="font-size: 11px; font-weight: 800; background-color: #f1f5f9; padding: 4px 10px; border-radius: 999px; color: #475569; text-transform: uppercase;">Appliance Quote Verdict</span>
          <h2 style="font-size: 32px; font-weight: 900; color: \${vs.color}; margin: 15px 0 10px 0; letter-spacing: -0.02em;">
            \${vs.label} VERDICT
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
            This fairness check was executed successfully for a <strong>\${item.appliance_type?.toUpperCase()}</strong> in the location of <strong>\${item.city}</strong> for <strong>\${item.service_type}</strong>.
          </p>
        </div>
        
        <!-- Details Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background-color: #fcfbf8; border: 1px solid #e2e8f0; border-radius: 14px; padding: 15px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Your Quoted Price</div>
            <div style="font-size: 24px; font-weight: 800; color: #1e293b; margin-top: 5px; font-family: 'Outfit';">₹\${Number(item.quoted_price).toLocaleString('en-IN')}</div>
          </div>
          <div style="background-color: #fcfbf8; border: 1px solid #e2e8f0; border-radius: 14px; padding: 15px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Potential Cost Savings</div>
            <div style="font-size: 24px; font-weight: 800; color: #059669; margin-top: 5px; font-family: 'Outfit';">₹\${Number(item.potential_savings || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
        
        <!-- Diagnosis Details -->
        <div style="border-top: 2px dashed #e2e8f0; padding-top: 25px; margin-bottom: 25px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #1c446b; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 0.05em;">Diagnostic Assessment</h3>
          <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0; background-color: #f8fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #1c446b;">
            \${resultData.explanation || 'Based on local market comparisons, the submitted quote has been evaluated against registered service rates and certified technician pricing indexes. We have found significant deviations suggesting opportunities for negotiation or savings.'}
          </p>
        </div>

        <!-- Trust Signals -->
        <div style="display: flex; gap: 15px; align-items: center; background-color: #eff6ff; padding: 12px 18px; border-radius: 12px; margin-bottom: 30px;">
          <span style="font-size: 20px;">🛡️</span>
          <div style="font-size: 12px; color: #1e40af; line-height: 1.5;">
            <strong>Trust Factor Assured</strong>: Market reference estimates are backed by public labor lists, nearby competitor ratings, and genuine local provider checks.
          </div>
        </div>
        
        <!-- Footer Signatures -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <div>
            <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">ID: SH-\${item.id}</div>
            <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">Secured and Verified in Service-One Cloud Database</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-family: 'Georgia', serif; font-style: italic; color: #1c446b; font-weight: 700; margin-bottom: 4px;">ServiceOne Verified</div>
            <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Diagnostic Engine Signature</div>
          </div>
        </div>
      </div>
    `
    
    const opt = {
      margin: 10,
      filename: `serviceone_report_\${item.appliance_type}_\${item.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    html2pdf().from(element).set(opt).save()
  }

  const toggleBookmark = async (id) => {
    try {
      const res = await fetch(`${API}/api/history/${id}/bookmark`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setHistory(prev => prev.map(item => 
          item.id === id ? { ...item, is_bookmarked: data.is_bookmarked } : item
        ))
      }
    } catch (err) {
      console.error('Bookmark error:', err)
    }
  }

  const addCustomSearch = async (e) => {
    e.preventDefault()
    if (!newSearch.search_label.trim() || !newSearch.search_url.trim()) return
    setAddingSearch(true)
    try {
      const res = await fetch(`${API}/api/custom-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newSearch, 
          search_type: 'custom',
          user_email: currentUser?.email || null,
          user_name: currentUser?.name || null,
        }),
      })
      if (res.ok) {
        setNewSearch({ search_label: '', search_url: '', notes: '' })
        fetchData(currentUser?.email)
      }
    } catch (err) {
      console.error('Add search error:', err)
    }
    setAddingSearch(false)
  }

  const deleteCustomSearch = async (id) => {
    try {
      await fetch(`${API}/api/custom-search/${id}`, { method: 'DELETE' })
      setCustomSearches(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const totalSavings = history.reduce((acc, item) => {
    return acc + (item.potential_savings > 0 ? Number(item.potential_savings) : 0)
  }, 0)

  const bookmarkedCount = history.filter(h => h.is_bookmarked).length

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#f8fafc', minHeight: '90vh', padding: '3rem 1rem 5rem' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>My Dashboard</h1>
            <button 
              className="btn btn-secondary" 
              onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
            >
              Log Out
            </button>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={statCard('#3b82f6', '#1d4ed8')}>
              <div style={statLabel}>TOTAL SEARCHES</div>
              <div style={statValue}>{history.length}</div>
            </div>
            <div style={statCard('#10b981', '#059669')}>
              <div style={statLabel}>POTENTIAL SAVINGS</div>
              <div style={statValue}>₹{totalSavings.toLocaleString('en-IN')}</div>
            </div>
            <div style={statCard('#f59e0b', '#d97706')}>
              <div style={statLabel}>BOOKMARKED</div>
              <div style={statValue}>{bookmarkedCount}</div>
            </div>
            <div style={statCard('#8b5cf6', '#7c3aed')}>
              <div style={statLabel}>CUSTOM SEARCHES</div>
              <div style={statValue}>{customSearches.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', background: '#e2e8f0', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
            {['history', 'bookmarks', 'custom', 'reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 24px', borderRadius: '10px', border: 'none',
                  background: activeTab === tab ? '#fff' : 'transparent',
                  color: activeTab === tab ? '#0f172a' : '#64748b',
                  fontWeight: activeTab === tab ? 700 : 500,
                  fontSize: '14px', cursor: 'pointer',
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab === 'history' ? '📊 Search History' : tab === 'bookmarks' ? '⭐ Bookmarked' : tab === 'custom' ? '🔗 Custom Searches' : '🤝 Community Reports'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div>
              <style>{`
                @keyframes pulse-skeleton {
                  0%, 100% { opacity: 0.5; }
                  50% { opacity: 1; }
                }
              `}</style>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{
                    padding: '1.5rem',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    animation: 'pulse-skeleton 1.5s infinite ease-in-out'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '120px', height: '20px', background: '#e2e8f0', borderRadius: '6px' }} />
                      <div style={{ width: '80px', height: '24px', background: '#e2e8f0', borderRadius: '12px' }} />
                    </div>
                    <div style={{ width: '100%', height: '16px', background: '#f1f5f9', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <div style={{ width: '100px', height: '14px', background: '#f1f5f9', borderRadius: '4px' }} />
                      <div style={{ width: '150px', height: '14px', background: '#f1f5f9', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ── Search History Tab ──────────────────── */}
              {(activeTab === 'history' || activeTab === 'bookmarks') && (
                <div style={tableWrapper}>
                  {(activeTab === 'bookmarks' ? history.filter(h => h.is_bookmarked) : history).length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{activeTab === 'bookmarks' ? '⭐' : '📊'}</div>
                      <p>{activeTab === 'bookmarks' ? 'No bookmarked searches yet.' : 'No searches yet. Check a quote to get started!'}</p>
                      <button className="btn btn-primary" onClick={() => navigate('/services')} style={{ marginTop: '1rem' }}>
                        Check a Quote
                      </button>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Search</th>
                          <th style={thStyle}>Verdict</th>
                          <th style={thStyle}>Quote</th>
                          <th style={thStyle}>Savings</th>
                          <th style={thStyle}>Certificate</th>
                          <th style={thStyle}>Sources</th>
                          <th style={thStyle}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeTab === 'bookmarks' ? history.filter(h => h.is_bookmarked) : history).map(item => {
                          const vs = VERDICT_STYLES[item.verdict] || VERDICT_STYLES.fair
                          const sourceLinks = item.source_links || []
                          const isExpanded = expandedId === item.id

                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={tdStyle}>{formatDate(item.created_at)}</td>
                              <td style={tdStyle}>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>
                                  {item.appliance_type?.toUpperCase()} — {item.service_type}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{item.city}</div>
                              </td>
                              <td style={tdStyle}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: '8px', fontSize: '11px',
                                  fontWeight: 800, background: vs.bg, color: vs.color,
                                }}>
                                  {vs.label}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, fontWeight: 700, color: '#1e293b', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em' }}>
                                ₹{Number(item.quoted_price || 0).toLocaleString('en-IN')}
                              </td>
                              <td style={tdStyle}>
                                {item.potential_savings > 0 ? (
                                  <span style={{ color: '#059669', fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em' }}>
                                    ₹{Number(item.potential_savings).toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>—</span>
                                )}
                              </td>
                              <td style={tdStyle}>
                                <button
                                  onClick={() => downloadPDFReport(item)}
                                  title="Download PDF Diagnostic Certificate"
                                  style={{
                                    background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 12px',
                                    borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                    color: '#1c446b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#1c446b'; }}
                                  onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                >
                                  <span>📥</span> <span>Download PDF</span>
                                </button>
                              </td>
                              <td style={tdStyle}>
                                {sourceLinks.length > 0 ? (
                                  <button
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                    style={{
                                      background: '#eef2ff', border: 'none', padding: '4px 10px',
                                      borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                      color: '#4f46e5', cursor: 'pointer',
                                    }}
                                  >
                                    {isExpanded ? 'Hide' : `${sourceLinks.length} links`}
                                  </button>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                )}
                              </td>
                              <td style={tdStyle}>
                                <button
                                  onClick={() => toggleBookmark(item.id)}
                                  title={item.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '18px', padding: '4px',
                                  }}
                                >
                                  {item.is_bookmarked ? '⭐' : '☆'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* Expanded source links */}
                  {expandedId && (() => {
                    const item = history.find(h => h.id === expandedId)
                    const links = item?.source_links || []
                    if (!links.length) return null
                    return (
                      <div style={{
                        padding: '16px 20px', background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0', animation: 'fadeUp 0.2s ease',
                      }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                          🔗 Source Links for this search
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block', padding: '10px 14px',
                                background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: '8px', textDecoration: 'none',
                                transition: 'border-color 0.15s ease',
                              }}
                            >
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb' }}>
                                {link.title || link.url}
                              </div>
                              {link.snippet && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  {link.snippet.slice(0, 120)}...
                                </div>
                              )}
                              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', wordBreak: 'break-all' }}>
                                {link.url}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ── Custom Searches Tab ──────────────────── */}
              {activeTab === 'custom' && (
                <div>
                  {/* Add Custom Search Form */}
                  <div style={tableWrapper}>
                    <div style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                        ➕ Add a Custom Search
                      </h3>
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                        Save any URL you want to track — repair guides, price comparisons, provider listings, etc.
                      </p>
                      <form onSubmit={addCustomSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 200px' }}>
                          <label style={labelStyle}>Label *</label>
                          <input
                            type="text"
                            placeholder="e.g. Samsung AC prices on UC"
                            value={newSearch.search_label}
                            onChange={e => setNewSearch(s => ({ ...s, search_label: e.target.value }))}
                            style={inputStyle}
                            required
                          />
                        </div>
                        <div style={{ flex: '2 1 300px' }}>
                          <label style={labelStyle}>URL *</label>
                          <input
                            type="url"
                            placeholder="https://www.urbancompany.com/..."
                            value={newSearch.search_url}
                            onChange={e => setNewSearch(s => ({ ...s, search_url: e.target.value }))}
                            style={inputStyle}
                            required
                          />
                        </div>
                        <div style={{ flex: '1 1 150px' }}>
                          <label style={labelStyle}>Notes</label>
                          <input
                            type="text"
                            placeholder="Optional notes"
                            value={newSearch.notes}
                            onChange={e => setNewSearch(s => ({ ...s, notes: e.target.value }))}
                            style={inputStyle}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={addingSearch}
                          className="btn btn-primary"
                          style={{ padding: '10px 24px', height: '42px' }}
                        >
                          {addingSearch ? 'Saving...' : 'Save'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Custom Searches List */}
                  <div style={{ ...tableWrapper, marginTop: '16px' }}>
                    {customSearches.length === 0 ? (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔗</div>
                        <p>No custom searches yet. Add one above!</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {customSearches.map(search => (
                          <div
                            key={search.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '16px',
                              padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>
                                {search.search_label}
                              </div>
                              <a
                                href={search.search_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '12px', color: '#2563eb', wordBreak: 'break-all' }}
                              >
                                {search.search_url}
                              </a>
                              {search.notes && (
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                  {search.notes}
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                              {formatDate(search.created_at)}
                            </div>
                            <button
                              onClick={() => deleteCustomSearch(search.id)}
                              style={{
                                background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                                fontWeight: 600, color: '#dc2626', cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick Action */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/services')} style={{ padding: '14px 32px' }}>
              + Check a New Quote
            </button>
          </div>
          {/* Submission Modal */}
          {showModal && (
            <div style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 9999, padding: '1rem'
            }}>
              <div style={{
                backgroundColor: '#ffffff', width: '100%', maxWidth: '520px',
                borderRadius: '24px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                border: '1px solid #e2e8f0', overflow: 'hidden'
              }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1c446b', margin: 0 }}>Submit Community Price Report</h3>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8' }}>✕</button>
                </div>
                
                <form onSubmit={submitCommunityReport} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>City *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Mumbai" 
                        value={modalForm.city} 
                        onChange={e => setModalForm(f => ({ ...f, city: e.target.value }))}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Area / Locality</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Bandra" 
                        value={modalForm.area} 
                        onChange={e => setModalForm(f => ({ ...f, area: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Appliance *</label>
                      <select 
                        value={modalForm.appliance} 
                        onChange={e => setModalForm(f => ({ ...f, appliance: e.target.value }))}
                        style={inputStyle}
                        required
                      >
                        {['AC', 'Fridge', 'Washing Machine', 'TV', 'RO', 'Geyser'].map(app => (
                          <option key={app} value={app}>{app}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Service Type</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Deep Cleaning" 
                        value={modalForm.service_type} 
                        onChange={e => setModalForm(f => ({ ...f, service_type: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Provider Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Urban Company" 
                        value={modalForm.provider_name} 
                        onChange={e => setModalForm(f => ({ ...f, provider_name: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Quoted Price (₹) *</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 1500" 
                        value={modalForm.quoted_price} 
                        onChange={e => setModalForm(f => ({ ...f, quoted_price: e.target.value }))}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Upload Proof Image (Bill / Receipt / Quoted Image)</label>
                    <div style={{
                      border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '16px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#f8fafc', cursor: 'pointer', position: 'relative'
                    }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                      {imagePreview ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={imagePreview} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{proofFile?.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{uploadingImage ? 'Uploading image...' : 'Ready to submit'}</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '24px', marginBottom: '4px' }}>📸</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Click to select quote receipt or bill photo</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Supports PNG, JPEG up to 10MB</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Additional Notes / Context</label>
                    <textarea 
                      placeholder="Mention issues resolved, extra parts cost, or technician rating..."
                      value={modalForm.notes} 
                      onChange={e => setModalForm(f => ({ ...f, notes: e.target.value }))}
                      style={{ ...inputStyle, height: '80px', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyStyle: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" disabled={uploadingImage} className="btn btn-primary" style={{ flex: 2 }}>
                      {uploadingImage ? 'Uploading Image...' : 'Submit Price Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

// ── Inline Styles ─────────────────────────────────────────
const statCard = (from, to) => ({
  background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
  color: 'white', padding: '1.5rem', borderRadius: '18px',
  boxShadow: `0 10px 20px -5px ${from}40`,
})

const statLabel = {
  fontSize: '0.75rem', opacity: 0.85, fontWeight: 700,
  letterSpacing: '0.08em', marginBottom: '0.5rem',
}

const statValue = {
  fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.02em',
}

const tableWrapper = {
  backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
}

const thStyle = {
  padding: '14px 16px', color: '#64748b', fontSize: '11px',
  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
}

const tdStyle = {
  padding: '14px 16px', color: '#475569', fontSize: '14px',
}

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#475569', marginBottom: '4px',
}

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
  borderRadius: '10px', fontSize: '14px', outline: 'none',
  transition: 'border-color 0.15s ease', boxSizing: 'border-box',
}
