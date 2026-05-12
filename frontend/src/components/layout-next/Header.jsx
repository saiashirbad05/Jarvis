'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import '../layout/Header.css'

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
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const getUserFirstLetter = () => {
    if (!user) return 'U'
    const name = user.name || user.email || ''
    if (typeof name === 'string' && name.trim()) {
      return name.trim()[0].toUpperCase()
    }
    return 'U'
  }

  const getUserFirstName = () => {
    if (!user) return 'User'
    const name = user.name || ''
    if (typeof name === 'string' && name.trim()) {
      return name.trim().split(' ')[0]
    }
    const email = user.email || ''
    if (typeof email === 'string' && email.trim()) {
      return email.split('@')[0]
    }
    return 'User'
  }

  const hasValidPicture = () => {
    return user && typeof user.picture === 'string' && user.picture.startsWith('http')
  }

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('token')
    const cachedUserStr = localStorage.getItem('user')
    console.log('[Header Debug] Mounted: true, Token:', token ? 'Found' : 'Missing', 'CachedUserStr:', cachedUserStr)

    // 1. If we have cached user info, load it immediately completely independent of token decoding!
    if (cachedUserStr) {
      try {
        const parsedUser = JSON.parse(cachedUserStr)
        if (parsedUser && (parsedUser.email || parsedUser.name)) {
          console.log('[Header Debug] Loaded user successfully from cachedUserStr:', parsedUser)
          setUser(parsedUser)
        }
      } catch (e) {
        console.error("[Header Debug] Failed to parse cached user", e)
      }
    }

    // 2. If we have a JWT token, decode it and merge any extra fields
    if (token) {
      const decoded = decodeJwt(token)
      if (decoded) {
        console.log('[Header Debug] Decoded JWT Token:', decoded)
        setUser(prevUser => {
          const merged = { ...decoded, ...prevUser }
          if ((!merged.name || String(merged.name).trim() === "") && decoded.name) {
            merged.name = decoded.name
          }
          if (!merged.picture && decoded.picture) {
            merged.picture = decoded.picture
          }
          console.log('[Header Debug] Merged JWT user state:', merged)
          return merged
        })
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setDropdownOpen(false)
    window.location.href = '/'
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <a className="logo" href="/">
          <img src="/logo.png" alt="ServiceOne Logo" className="logo-img" />
          <span>ServiceOne</span>
        </a>

        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/services/">Services</a></li>
          <li><a href="/about/">About</a></li>
          <li><a href="/contact/">Contact</a></li>
          {user && (user.role === 'admin' || ['developer@serviceone.dev', 'test@serviceone.dev', 'admin@serviceone.dev'].includes(user.email)) && (
            <li><a href="/admin/" style={{ color: '#eb5b31', fontWeight: 700 }}>🛡️ Admin Console</a></li>
          )}
        </ul>
        <div className="nav-actions" style={{ position: 'relative' }}>
          {mounted && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* User Avatar & Menu */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#334155',
                    transition: 'border 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  {hasValidPicture() ? (
                    <img src={user.picture} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#eb5b31', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                      {getUserFirstLetter()}
                    </div>
                  )}
                  <span>{getUserFirstName()}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '200px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0',
                    padding: '6px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'User'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                    <a 
                      href="/services/"
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
                    </a>
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
              <a className="btn btn-primary" href="/login/">Log in</a>
            </>
          )}
        </div>

        <button 
          className="hamburger" 
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            width: '38px',
            height: '38px',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <span style={{
            display: 'block',
            width: '18px',
            height: '2px',
            background: '#1e293b',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none'
          }} />
          <span style={{
            display: 'block',
            width: '18px',
            height: '2px',
            background: '#1e293b',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            opacity: menuOpen ? 0 : 1
          }} />
          <span style={{
            display: 'block',
            width: '18px',
            height: '2px',
            background: '#1e293b',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none'
          }} />
        </button>
      </div>

      {/* Responsive Mobile Drawer/Menu Links */}
      {menuOpen && (
        <div style={{
          background: 'rgba(252, 251, 248, 0.98)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(231, 225, 216, 0.9)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          animation: 'fadeInSlideDown 0.3s ease-out'
        }}>
          <style>{`
            @keyframes fadeInSlideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <li><a href="/" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 600, color: '#334155', textDecoration: 'none', display: 'block', padding: '6px 0' }}>Home</a></li>
            <li><a href="/services/" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 600, color: '#334155', textDecoration: 'none', display: 'block', padding: '6px 0' }}>Services</a></li>
            <li><a href="/about/" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 600, color: '#334155', textDecoration: 'none', display: 'block', padding: '6px 0' }}>About</a></li>
            <li><a href="/contact/" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 600, color: '#334155', textDecoration: 'none', display: 'block', padding: '6px 0' }}>Contact</a></li>
            {user && (user.role === 'admin' || ['developer@serviceone.dev', 'test@serviceone.dev', 'admin@serviceone.dev'].includes(user.email)) && (
              <li><a href="/admin/" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', color: '#eb5b31', fontWeight: 700, textDecoration: 'none', display: 'block', padding: '6px 0' }}>🛡️ Admin Console</a></li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
