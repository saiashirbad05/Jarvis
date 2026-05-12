import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

const API = 'http://127.0.0.1:8000'

export default function AdminPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authorized, setAuthorized] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeFilter, setActiveFilter] = useState('pending') // pending, approved, rejected
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem('token')
    const cachedUser = localStorage.getItem('user')
    
    if (!token) {
      navigate('/login')
      return
    }

    let userObj = null
    if (cachedUser) {
      try {
        userObj = JSON.parse(cachedUser)
      } catch (e) {
        // Fallback
      }
    }

    // Determine admin authority
    const isAdmin = userObj && (
      userObj.role === 'admin' || 
      ['developer@serviceone.dev', 'test@serviceone.dev', 'admin@serviceone.dev'].includes(userObj.email)
    )

    if (!isAdmin) {
      setError('Unauthorized access. Admin privileges required.')
      setLoading(false)
      return
    }

    setAuthorized(true)
    setCurrentUser(userObj)
    fetchReports()
  }, [navigate])

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/admin/reports`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
      } else {
        setError('Failed to fetch administrator reports.')
      }
    } catch (err) {
      setError('Unable to connect to the backend server.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/reports/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, approved_status: 'approved' } : r))
      }
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/reports/${id}/reject`, { method: 'POST' })
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, approved_status: 'rejected' } : r))
      }
    } catch (err) {
      console.error('Rejection failed:', err)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filteredReports = reports.filter(r => r.approved_status === activeFilter)

  if (!authorized && !loading) {
    return (
      <>
        <Header />
        <main style={{ backgroundColor: '#fcfbf8', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '3rem', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Access Denied</h2>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              You do not have permission to view the ServiceOne administrative console. Please contact system administrators.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#fcfbf8', minHeight: '90vh', padding: '3rem 1rem 5rem' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#eb5b31', color: 'white', padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Panel</span>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1c446b', margin: '8px 0 0 0', letterSpacing: '-0.02em' }}>Community Moderation</h1>
            </div>
            
            <button className="btn btn-secondary" onClick={fetchReports} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
              🔄 Refresh List
            </button>
          </div>

          {/* Filter Status Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem', backgroundColor: '#e2e8f0', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
            {[
              { id: 'pending', label: '⏳ Pending Review', count: reports.filter(r => r.approved_status === 'pending').length },
              { id: 'approved', label: '✅ Approved Reports', count: reports.filter(r => r.approved_status === 'approved').length },
              { id: 'rejected', label: '❌ Rejected History', count: reports.filter(r => r.approved_status === 'rejected').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  background: activeFilter === tab.id ? '#ffffff' : 'transparent',
                  color: activeFilter === tab.id ? '#0f172a' : '#64748b',
                  fontWeight: activeFilter === tab.id ? 700 : 500,
                  fontSize: '13px', cursor: 'pointer',
                  boxShadow: activeFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: activeFilter === tab.id ? '#1c446b' : 'white', color: activeFilter === tab.id ? 'white' : '#475569', padding: '2px 6px', borderRadius: '999px', border: activeFilter === tab.id ? 'none' : '1px solid #cbd5e1' }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '240px', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', animation: 'pulse-skeleton 1.5s infinite ease-in-out' }} />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍃</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#475569' }}>No reports found</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>There are currently no community reports matching this review status.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {filteredReports.map(rep => (
                <div 
                  key={rep.id} 
                  style={{
                    backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0',
                    padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Top: Appliance & Service */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#eff6ff', color: '#1c446b', padding: '2px 8px', borderRadius: '6px' }}>
                        {rep.appliance?.toUpperCase()}
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: '6px 0 2px 0' }}>{rep.service_type || 'General Service'}</h3>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>📍 {rep.area ? `${rep.area}, ` : ''}{rep.city}</p>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 950, color: '#1c446b', fontFamily: "'Outfit', sans-serif" }}>
                      ₹{Number(rep.quoted_price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Provider details */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '12px', fontSize: '13px' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>🛠️ PROVIDER</div>
                    <div style={{ color: '#1e293b', fontWeight: 700, marginTop: '2px' }}>{rep.provider_name || 'Anonymous Provider'}</div>
                  </div>

                  {/* Notes */}
                  {rep.notes && (
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{rep.notes}"
                    </p>
                  )}

                  {/* Image Proof Thumbnail */}
                  {rep.proof_image_url && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Receipt Proof:</div>
                      <div 
                        onClick={() => setLightboxImage(rep.proof_image_url)}
                        style={{
                          width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden',
                          border: '1px solid #cbd5e1', cursor: 'zoom-in', position: 'relative'
                        }}
                      >
                        <img src={rep.proof_image_url} alt="Proof Bill" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0}>
                          <span style={{ fontSize: '18px' }}>🔍</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submitter Details & Date */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                    <div>
                      <div>SUBMITTED BY</div>
                      <div style={{ color: '#475569', fontWeight: 600 }}>{rep.user_name || rep.user_email || 'Anonymous'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>DATE</div>
                      <div style={{ color: '#475569', fontWeight: 600 }}>{formatDate(rep.created_at)}</div>
                    </div>
                  </div>

                  {/* Actions (Only show for pending) */}
                  {activeFilter === 'pending' && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <button 
                        onClick={() => handleReject(rep.id)}
                        className="btn"
                        style={{
                          flex: 1, padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                          backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fecaca' }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
                      >
                        Reject Report
                      </button>
                      <button 
                        onClick={() => handleApprove(rep.id)}
                        className="btn"
                        style={{
                          flex: 2, padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                          backgroundColor: '#1c446b', border: 'none', color: 'white', cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#173a5b' }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = '#1c446b' }}
                      >
                        Approve & Publish
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fullscreen Lightbox */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 99999, cursor: 'zoom-out'
          }}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}
          >
            ✕
          </button>
          <img 
            src={lightboxImage} 
            alt="Expanded Receipt Proof" 
            style={{ maxWidth: '90%', maxHeight: '85%', borderRadius: '16px', border: '4px solid white', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.55)', animation: 'scaleUp 0.2s ease-out' }} 
          />
        </div>
      )}

      <Footer />
    </>
  )
}
