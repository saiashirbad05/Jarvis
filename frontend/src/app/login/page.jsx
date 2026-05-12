'use client'

import Header from '../../components/layout-next/Header'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function LoginPage() {
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // Fallback handler for the standard iframe button (if used)
  const handleSuccess = async (credentialResponse) => {
    console.log('Standard Login Success:', credentialResponse)
    const token = credentialResponse.credential
    localStorage.setItem('token', token)
    
    const decoded = decodeToken(token)
    if (decoded) {
      // Set initial user details from token directly
      const initialUser = {
        email: decoded.email,
        name: decoded.name || decoded.given_name || decoded.email.split('@')[0],
        picture: decoded.picture
      }
      localStorage.setItem('user', JSON.stringify(initialUser))

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: decoded.email,
            name: decoded.name || decoded.given_name || decoded.email.split('@')[0]
          })
        })
        if (res.ok) {
          const data = await res.json()
          const mergedUser = { ...initialUser, ...data.user }
          if ((!mergedUser.name || String(mergedUser.name).trim() === "") && initialUser.name) {
            mergedUser.name = initialUser.name
          }
          if (!mergedUser.picture && decoded.picture) {
            mergedUser.picture = decoded.picture
          }
          localStorage.setItem('user', JSON.stringify(mergedUser))
        }
      } catch (err) {
        console.error('Failed to register user in backend:', err)
      }
    }
    setTimeout(() => {
      window.location.href = '/'
    }, 150)
  }

  // 🌟 Premium Custom hook-based login flow (unaffected by iframe loading issues/cookie blocks)
  const loginWithGoogleCustom = useGoogleLogin({
    scope: 'email profile openid',
    onSuccess: async (tokenResponse) => {
      console.log('Custom Google Login Success:', tokenResponse)
      try {
        // Fetch user profile info securely from Google Auth API using the custom bearer access_token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        })
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json()
          console.log('Fetched User Profile Info:', userInfo)
          
          localStorage.setItem('token', tokenResponse.access_token)
          
          // Set initial user details from Google userinfo directly so the login shows immediately!
          const initialUser = {
            email: userInfo.email || '',
            name: userInfo.name || userInfo.given_name || (userInfo.email ? userInfo.email.split('@')[0] : 'User'),
            picture: userInfo.picture || null
          }
          localStorage.setItem('user', JSON.stringify(initialUser))
          
          // Sync profile details with backend db
          try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userInfo.email,
                name: userInfo.name || userInfo.given_name || userInfo.email.split('@')[0]
              })
            })
            if (res.ok) {
              const data = await res.json()
              const mergedUser = { ...initialUser, ...data.user }
              if ((!mergedUser.name || String(mergedUser.name).trim() === "") && initialUser.name) {
                mergedUser.name = initialUser.name
              }
              if (!mergedUser.picture && userInfo.picture) {
                mergedUser.picture = userInfo.picture
              }
              localStorage.setItem('user', JSON.stringify(mergedUser))
            }
          } catch (err) {
            console.error('Failed to register user in backend:', err)
          }
          
          // Instant, smooth redirection straight to the homepage!
          setTimeout(() => {
            window.location.href = '/'
          }, 150)
        }
      } catch (err) {
        console.error('Error in custom Google Authentication handshake:', err)
      }
    },
    onError: (error) => {
      console.error('Custom Google Auth Failed:', error)
    }
  })

  const handleError = () => {
    console.log('Standard Login Failed')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header />
      
      {/* Premium responsive styles injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .login-image-panel {
            display: none !important;
          }
          .login-form-panel {
            flex: 1 !important;
            padding: 1.5rem !important;
          }
          .login-main {
            flex-direction: column !important;
          }
        }
        @media (max-width: 480px) {
          .login-title {
            font-size: 1.75rem !important;
          }
          .login-subtitle {
            font-size: 0.95rem !important;
            margin-bottom: 1.5rem !important;
          }
          .login-logo-box {
            width: 90px !important;
            height: 90px !important;
            margin-bottom: 1.5rem !important;
          }
          .login-logo-img {
            width: 70px !important;
            height: 70px !important;
          }
        }
      `}} />

      <main className="login-main" style={{ flex: 1, display: 'flex' }}>
        
        {/* Left Side: Image / Decoration (Hidden on small screens) */}
        <div className="login-image-panel" style={{
          flex: '1',
          display: 'flex',
          backgroundColor: '#eff6ff',
          backgroundImage: 'url(/login-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}>
          {/* Overlay to ensure text readability if we add text later, and to give a premium feel */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.7))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '4rem'
          }}>
            <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              Know the Fair Price.
            </h2>
            <p style={{ color: '#e2e8f0', fontSize: '1.2rem', maxWidth: '400px', lineHeight: 1.6, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Join thousands of users diagnosing home service issues and connecting with trusted, verified professionals.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-form-panel" style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            {/* Small icon/logo for the form */}
            <div className="login-logo-box" style={{ width: '115px', height: '115px', backgroundColor: '#eff6ff', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)' }}>
              <img className="login-logo-img" src="/logo.png" alt="ServiceOne Logo" style={{ width: '95px', height: '95px', objectFit: 'contain' }} />
            </div>
            
            <h1 className="login-title" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Welcome Back</h1>
            <p className="login-subtitle" style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1.1rem' }}>Sign in to access your reports and history.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <button
                onClick={() => loginWithGoogleCustom()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '320px',
                  height: '48px',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '24px',
                  color: '#1e293b',
                  fontSize: '15px',
                  fontWeight: '600',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.05)',
                  outline: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.05)'
                }}
              >
                {/* Genuine High-fidelity Google SVG Logo */}
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block', flexShrink: 0 }}>
                  <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.77 2.15c1.62-1.5 2.55-3.7 2.55-6.32z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.77-2.15c-.77.52-1.75.83-2.77.83-2.34 0-4.32-1.58-5.03-3.7L1.6 12.9c1.48 2.94 4.53 4.93 7.82 4.93z" />
                  <path fill="#FBBC05" d="M3.97 10.78c-.18-.54-.28-1.12-.28-1.71s.1-1.17.28-1.71L1.6 5.2c-.59 1.18-.93 2.5-.93 3.8s.34 2.62.93 3.8l2.37-1.82z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.1C13.46.67 11.42 0 9 0 5.71 0 2.66 2 1.18 4.93l2.79 2.15C4.68 4.95 6.66 3.58 9 3.58z" />
                </svg>
                Continue with Google
              </button>
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
