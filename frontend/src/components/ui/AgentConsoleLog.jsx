'use client'

import React, { useState, useEffect, useRef } from 'react'

const AGENT_LOGS_TEMPLATES = {
  0: [
    "[GEO_DISCOVERER] Booting sub-agent threads...",
    "[GEO_DISCOVERER] Querying Indian Geographic Database (JSON mapping v2.4)",
    "[GEO_DISCOVERER] Target locality identified: pincode, area",
    "[GEO_DISCOVERER] Mapping coordinates to Lat/Lng indices...",
    "[GEO_DISCOVERER] Checking regional municipality boundaries for tax markup...",
    "[GEO_DISCOVERER] Geolocation payload validated. Passing context to Scraper."
  ],
  1: [
    "[WEB_CRAWLER] Activating headless scraping cluster...",
    "[WEB_CRAWLER] Crawling Sulekha, Urban Company & verified regional listings...",
    "[WEB_CRAWLER] Scraped 18 active local quotes matching category...",
    "[WEB_CRAWLER] Filtering out duplicate entries & stale pricing logs...",
    "[WEB_CRAWLER] Regional base-rate calculated. Scraping complete."
  ],
  2: [
    "[BRAND_INTEL] Analyzing manufacturer parts database...",
    "[BRAND_INTEL] Fetching specific parts markup coefficients for brand...",
    "[BRAND_INTEL] Historic repair complexity rated: 7.2/10 (Expert required)",
    "[BRAND_INTEL] Fetching active standard manufacturer warranty guidelines...",
    "[BRAND_INTEL] Compiling manufacturer reliability offset index."
  ],
  3: [
    "[PRICE_ESTIMATOR] Ingesting regional crawled datasets...",
    "[PRICE_ESTIMATOR] Computing standard deviation pricing envelopes...",
    "[PRICE_ESTIMATOR] Standard market rate set to marketAvg",
    "[PRICE_ESTIMATOR] Calculating user quoted price variance: variancePct%",
    "[PRICE_ESTIMATOR] Risk evaluation models complete. Verdict locked."
  ],
  4: [
    "[REPORT_COMPILER] Initiating final sign-off protocols...",
    "[REPORT_COMPILER] Bundling analytical findings & nearby shop markers...",
    "[REPORT_COMPILER] Creating SHA-256 digital certificate hash...",
    "[REPORT_COMPILER] Compiling high-fidelity PDF invoice template elements...",
    "[REPORT_COMPILER] Packaging complete. Locking diagnostic session."
  ]
}

export default function AgentConsoleLog({ activeAgentIndex, form }) {
  const [logs, setLogs] = useState([])
  const containerRef = useRef(null)

  useEffect(() => {
    if (activeAgentIndex === -1) {
      setLogs([])
      return
    }

    // When active agent changes, stream in logs with typing delays
    const templates = AGENT_LOGS_TEMPLATES[activeAgentIndex] || []
    let currentLine = 0

    // Reset logs or keep them cumulative? Cumulative is MUCH cooler!
    setLogs(prev => [
      ...prev,
      `>>> AGENT STEP ${activeAgentIndex + 1} START: [System Thread Ingest]`
    ])

    const interval = setInterval(() => {
      if (currentLine < templates.length) {
        let text = templates[currentLine]
        // Customize with user form inputs
        text = text.replace("pincode", form.pincode || "110001")
        text = text.replace("area", form.area || "Main Market")
        text = text.replace("category", form.appliance || "Appliance")
        text = text.replace("brand", form.brand || "Generic")
        
        setLogs(prev => [...prev, text])
        currentLine++
      } else {
        clearInterval(interval)
      }
    }, 180)

    return () => clearInterval(interval)
  }, [activeAgentIndex, form])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div style={{
      marginTop: '1.5rem',
      background: '#090d16',
      border: '1px solid #1e293b',
      borderRadius: '16px',
      padding: '20px',
      fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
      boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.2)'
    }}>
      {/* Terminal Title Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '10px',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
        </div>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>
          SERVICEONE_AGENT_CONSOLE
        </span>
        <div style={{ width: '32px' }} />
      </div>

      {/* Terminal Console Output */}
      <div 
        ref={containerRef}
        style={{
          height: '180px',
          overflowY: 'auto',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#38bdf8',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e293b #090d16'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
            <span style={{ animation: 'pulse 1.5s infinite', marginRight: '8px' }}>⚡</span> Waiting for agent activation trigger...
          </div>
        ) : (
          logs.map((log, i) => {
            let color = '#38bdf8' // Cyan for general logs
            if (log.startsWith('>>>')) {
              color = '#a855f7' // Purple for start steps
            } else if (log.includes('✓') || log.includes('complete')) {
              color = '#10b981' // Green for completions
            } else if (log.includes('Analyzing') || log.includes('Querying')) {
              color = '#fbbf24' // Yellow for lookups
            }

            return (
              <div key={i} style={{ color, wordBreak: 'break-all' }}>
                <span style={{ color: '#475569', marginRight: '6px' }}>$</span> {log}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
