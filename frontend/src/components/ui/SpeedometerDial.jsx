'use client'

import React from 'react'

export default function SpeedometerDial({ angle, verdict }) {
  // Determine gradient color based on verdict
  let glowColor = '#10b981'
  if (verdict === 'high') glowColor = '#fbbf24'
  if (verdict === 'suspicious') glowColor = '#ef4444'

  return (
    <div style={{
      position: 'relative',
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
      maxWidth: '320px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <style>{`
        @keyframes needleGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 4px ${glowColor}); }
          50% { filter: drop-shadow(0 0 12px ${glowColor}); }
        }
      `}</style>

      <svg width="240" height="140" viewBox="0 0 240 140" style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          {/* Glass background gradient */}
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.03)" />
          </linearGradient>
          
          {/* Neon track gradients */}
          <linearGradient id="greenNeon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="yellowNeon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="redNeon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Inner Glass Arch background */}
        <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="url(#glassGrad)" strokeWidth="18" strokeLinecap="round" />

        {/* Ambient Glow Arc */}
        <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={glowColor} strokeWidth="14" strokeLinecap="round" opacity="0.15" filter="url(#neonGlow)" />

        {/* Gauge Zones */}
        {/* Fair (Green) */}
        <path d="M 20 120 A 100 100 0 0 1 80 33.4" fill="none" stroke="url(#greenNeon)" strokeWidth="12" strokeLinecap="round" />
        
        {/* Average (Yellow) */}
        <path d="M 80 33.4 A 100 100 0 0 1 160 33.4" fill="none" stroke="url(#yellowNeon)" strokeWidth="12" strokeLinecap="round" />
        
        {/* Suspicious (Red) */}
        <path d="M 160 33.4 A 100 100 0 0 1 220 120" fill="none" stroke="url(#redNeon)" strokeWidth="12" strokeLinecap="round" />

        {/* Pivot anchor glow */}
        <circle cx="120" cy="120" r="16" fill="rgba(30, 27, 75, 0.2)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" />

        {/* Physical pivot needle */}
        <g transform={`translate(120, 120) rotate(${angle})`} style={{ transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          {/* Needle stick */}
          <line x1="0" y1="0" x2="0" y2="-88" stroke="#1c446b" strokeWidth="4" strokeLinecap="round" style={{ animation: 'needleGlowPulse 2s infinite' }} />
          {/* Pointy arrow head */}
          <polygon points="0,-94 -5,-83 5,-83" fill="#1c446b" />
          {/* Center node */}
          <circle cx="0" cy="0" r="9" fill="#1c446b" />
          <circle cx="0" cy="0" r="4" fill="#6366f1" />
        </g>
      </svg>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 8px',
        marginTop: '12px',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.08em'
      }}>
        <span style={{ color: '#059669' }}>FAIR</span>
        <span style={{ color: '#d97706', textAlign: 'center' }}>AVG</span>
        <span style={{ color: '#dc2626' }}>ALERT</span>
      </div>
    </div>
  )
}
