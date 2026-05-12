import Header from '../components/layout/Header'
import { GoogleLogin } from '@react-oauth/google'

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

  const handleSuccess = async (credentialResponse) => {
    console.log('Login Success:', credentialResponse)
    const token = credentialResponse.credential
    localStorage.setItem('token', token)
    
    const decoded = decodeToken(token)
    if (decoded) {
      try {
        const res = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: decoded.email,
            name: decoded.name || decoded.given_name || decoded.email.split('@')[0]
          })
        })
        if (res.ok) {
          const data = await res.json()
          localStorage.setItem('user', JSON.stringify(data.user))
        }
      } catch (err) {
        console.error('Failed to register user in backend:', err)
      }
    }
    
    window.location.href = '/dashboard'
  }

  const handleError = () => {
    console.log('Login Failed')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex' }}>
        
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
        <div style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            {/* Small icon/logo for the form */}
            <div style={{ width: '115px', height: '115px', backgroundColor: '#eff6ff', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)' }}>
              <img src="/logo.png" alt="ServiceOne Logo" style={{ width: '95px', height: '95px', objectFit: 'contain' }} />
            </div>
            
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Welcome Back</h1>
            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1.1rem' }}>Sign in to access your reports and history.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="filled_blue"
                shape="pill"
                text="continue_with"
                width="320px"
              />
            </div>

            <p style={{ marginTop: '2.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
