import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css'

function decodeJwt(token) {
  try {
    if (!token) return null
    if (token === 'mock_developer_bypass_token') {
      return {
        email: 'developer@serviceone.dev',
        name: 'Demo Developer',
        picture: null
      }
    }
    if (token.startsWith('mock_user')) {
      const uNum = token.replace('mock_user', '')
      return {
        email: `user${uNum}@serviceone.dev`,
        name: `User ${uNum}`,
        picture: null
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

export default function Header() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = decodeJwt(token)
      if (decoded) {
        const cached = localStorage.getItem('user')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setUser({ ...decoded, ...parsed })
          } catch (e) {
            setUser(decoded)
          }
        } else {
          setUser(decoded)
        }
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link className="logo" to="/">
          <img src="/logo.png" alt="ServiceOne Logo" className="logo-img" />
          <span>ServiceOne</span>
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact & Creator</Link></li>
          {user && (user.role === 'admin' || ['developer@serviceone.dev', 'test@serviceone.dev', 'admin@serviceone.dev'].includes(user.email)) && (
            <li><Link to="/admin" style={{ color: '#eb5b31', fontWeight: 700 }}>🛡️ Admin Console</Link></li>
          )}
        </ul>

        <div className="nav-actions" style={{ position: 'relative' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link className="btn btn-secondary" to="/services">Check Price</Link>
              
              {/* User Avatar & Menu */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {user.picture ? (
                    <img src={user.picture} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#eb5b31', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                      {user.name && user.name.trim() ? user.name.trim()[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                    {user.name && user.name.trim() ? user.name.trim().split(' ')[0] : 'User'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
                    padding: '8px',
                    zIndex: 1000,
                    animation: 'slideUp 0.15s ease-out'
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', wordBreak: 'break-all' }}>{user.name}</div>
                      <div style={{ color: '#64748b', fontSize: '12px', wordBreak: 'break-all', marginTop: '2px' }}>{user.email}</div>
                    </div>
                    {user && (user.role === 'admin' || ['developer@serviceone.dev', 'test@serviceone.dev', 'admin@serviceone.dev'].includes(user.email)) && (
                      <Link 
                        to="/admin" 
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          color: '#eb5b31',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          transition: 'background 0.1s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fffbeb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        🛡️ Admin Console
                      </Link>
                    )}
                    <Link 
                      to="/services" 
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        color: '#334155',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
                        borderRadius: '6px',
                        transition: 'background 0.1s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      🔍 Price Service Check
                    </Link>
                    <button 
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        color: '#dc2626',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        transition: 'background 0.1s',
                        marginTop: '4px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link className="btn btn-secondary" to="/login" style={{ marginRight: '1rem' }}>Log in</Link>
              <Link className="btn btn-primary" to="/services">Check Price</Link>
            </>
          )}
        </div>

        <button className="hamburger" aria-label="Open menu">
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
