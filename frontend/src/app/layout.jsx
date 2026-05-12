'use client'

import '../index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useState, useEffect } from 'react'

export default function RootLayout({ children }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '592281685075-32e72ussvkn9bdltlqfrbevvl4g8gapm.apps.googleusercontent.com'
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ServiceOne - Appliance Quote Fairness Checker</title>
        <meta name="description" content="Leverage secure multi-agent diagnostic algorithms to check repair quotes, find verified local mechanics, and save money." />
        <link rel="icon" type="image/png" href="/logo.png" />
      </head>
      <body suppressHydrationWarning style={{ transition: 'background-color 0.3s ease, color 0.3s ease' }}>
        <GoogleOAuthProvider clientId={clientId}>
          {children}
          
          {/* [UI-3] Premium Aubergine Dark & Light theme switcher floating button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Aubergine Dark Theme' : 'Switch to Classic Light Theme'}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: theme === 'light' ? '#121021' : '#ffffff',
              color: theme === 'light' ? '#ffffff' : '#121021',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
              border: theme === 'light' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 99999,
              fontSize: '22px',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
