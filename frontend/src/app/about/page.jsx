'use client'

import Header from '../../components/layout-next/Header'
import Footer from '../../components/layout-next/Footer'

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Header />
      
      <main style={{ paddingTop: '20px' }}>
        {/* Hero Section */}
        <section className="mobile-padding-reduce" style={{ padding: '8rem 1rem 4rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <div className="container" style={{ maxWidth: '1000px' }}>
            <h1 className="about-hero-title" style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.1 }}>
              Restoring Trust in <span style={{ color: '#3b82f6' }}>Home Services</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              ServiceOne is an AI-powered transparency platform designed to empower homeowners against unfair pricing in the appliance repair industry.
            </p>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="mobile-padding-reduce" style={{ padding: '6rem 1rem' }}>
          <div className="container responsive-grid-2col" style={{ maxWidth: '1100px', gap: '4rem', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>The Problem</h2>
              <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                Every year, millions of households in India face the same frustration: an appliance breaks down, and the repair quote feels suspiciously high. 
              </p>
              <ul style={{ color: '#475569', lineHeight: 2, fontSize: '1.1rem', listStyle: 'none', padding: 0 }}>
                <li>❌ <strong>Opaque Pricing:</strong> No standard rate cards for complex repairs.</li>
                <li>❌ <strong>Information Asymmetry:</strong> Technicians know the costs, customers don't.</li>
                <li>❌ <strong>Exploitative Charges:</strong> Overcharging for basic spare parts and gas refills.</li>
              </ul>
            </div>
            <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
              <img src="/about-problem.png" alt="Frustrated homeowner with bill" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </section>

        {/* The Solution Section */}
        <section className="mobile-padding-reduce" style={{ padding: '6rem 1rem', backgroundColor: '#f8fafc' }}>
          <div className="container responsive-grid-2col" style={{ maxWidth: '1100px', gap: '4rem', alignItems: 'center' }}>
            <div className="mobile-reverse-order" style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', order: 2 }}>
              <img src="/about-ai.png" alt="AI Data Insights" style={{ width: '100%', display: 'block' }} />
            </div>
            <div className="mobile-reverse-order" style={{ order: 1 }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Our AI Solution</h2>
              <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                ServiceOne leverages advanced AI and real-time market scraping to provide you with an authoritative "Fair Price" verdict in seconds.
              </p>
              <ul style={{ color: '#475569', lineHeight: 2, fontSize: '1.1rem', listStyle: 'none', padding: 0 }}>
                <li>✅ <strong>Real-time Scrapes:</strong> We monitor live market rates across major service providers.</li>
                <li>✅ <strong>AI Verification:</strong> Our models analyze your specific quote details against historical data.</li>
                <li>✅ <strong>Community Wisdom:</strong> Crowdsourced reports from thousands of verified repairs.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Inflation Graph Section */}
        <section className="mobile-padding-reduce" style={{ padding: '6rem 1rem', backgroundColor: '#ffffff' }}>
          <div className="container" style={{ maxWidth: '1000px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>The Rising Cost of Repairs</h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                Service costs in Indian urban centers have outpaced general inflation. Here is how ServiceOne keeps you protected.
              </p>
            </div>

            <div style={{ 
              backgroundColor: '#0f172a', 
              borderRadius: '32px', 
              padding: '3rem', 
              color: 'white',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative background elements */}
              <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)' }}></div>
              
              <div className="responsive-grid-1-2" style={{ gap: '3rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Indian Market Trends</h3>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }}></div>
                      <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Unverified Market Avg</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>+42% <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 400 }}>since 2021</span></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }}></div>
                      <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>ServiceOne Fair Price</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>Stable <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 400 }}>Transparent</span></div>
                  </div>
                </div>

                <div className="graph-svg-container" style={{ height: '300px', position: 'relative', paddingLeft: '1.5rem', width: '100%', minWidth: 0 }}>
                  {/* Simple SVG Graph */}
                  <svg width="100%" height="100%" viewBox="0 0 400 200" style={{ overflow: 'visible' }}>
                    {/* Grid lines */}
                    <line x1="0" y1="180" x2="400" y2="180" stroke="#334155" strokeWidth="1" />
                    <line x1="0" y1="130" x2="400" y2="130" stroke="#1e293b" strokeWidth="1" />
                    <line x1="0" y1="80" x2="400" y2="80" stroke="#1e293b" strokeWidth="1" />
                    <line x1="0" y1="30" x2="400" y2="30" stroke="#1e293b" strokeWidth="1" />

                    {/* Labels */}
                    <text x="-35" y="185" fill="#64748b" fontSize="10">₹500</text>
                    <text x="-35" y="135" fill="#64748b" fontSize="10">₹1500</text>
                    <text x="-35" y="85" fill="#64748b" fontSize="10">₹2500</text>
                    <text x="-35" y="35" fill="#64748b" fontSize="10">₹3500</text>

                    <text x="0" y="200" fill="#64748b" fontSize="10">2021</text>
                    <text x="133" y="200" fill="#64748b" fontSize="10">2023</text>
                    <text x="266" y="200" fill="#64748b" fontSize="10">2025</text>
                    <text x="380" y="200" fill="#64748b" fontSize="10">2026</text>

                    {/* Market Price Line (Red) */}
                    <path d="M 0 170 L 133 130 L 266 70 L 400 20" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                    {/* ServiceOne Price Line (Green) */}
                    <path d="M 0 170 L 133 150 L 266 140 L 400 135" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                    
                    {/* Points */}
                    <circle cx="400" cy="20" r="4" fill="#ef4444" />
                    <circle cx="400" cy="135" r="4" fill="#10b981" />
                  </svg>
                  
                  <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                    *Data based on average AC installation and Gas Refill charges in Delhi NCR, Mumbai, and Bangalore.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Gallery */}
        <section className="mobile-padding-reduce" style={{ padding: '6rem 1rem' }}>
          <div className="container" style={{ maxWidth: '1100px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: '3rem' }}>Our Vision for India</h2>
            <div className="responsive-grid-2col" style={{ gap: '2rem' }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <img src="/about-service.png" alt="Professional Service" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Standardized Quality</h3>
                  <p style={{ color: '#64748b' }}>Promoting transparency leads to higher service standards for everyone.</p>
                </div>
              </div>
              <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <img src="/about-happy.png" alt="Happy Family" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Peace of Mind</h3>
                  <p style={{ color: '#64748b' }}>Every Indian household deserves to feel confident when hiring a technician.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
