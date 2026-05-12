'use client'

import '../layout/Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="logo" href="/">
              <span className="logo-dot" />
              <span>ServiceOne</span>
            </a>
            <p>
              Know the fair price before you pay. Transparent quote checking for
              Indian home appliance repair and installation services.
            </p>
          </div>

          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              <li><a href="/services/">AC Services</a></li>
              <li><a href="/services/">AC Gas Refill</a></li>
              <li><a href="/services/">TV Repair</a></li>
              <li><a href="/services/">Washing Machine</a></li>
              <li><a href="/services/">Geyser Repair</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="/about/">About us</a></li>
              <li><a href="/services/">How it works</a></li>
              <li><a href="/community/">Community Reports</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="/contact/">Contact</a></li>
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span>© 2026 ServiceOne. All rights reserved.</span>
            <span>Made with care in India</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(15, 23, 42, 0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <img src="/iso_logo.png" alt="ISO 9001:2015 Certified" style={{ height: '88px', width: 'auto' }} />
          </div>
        </div>
      </div>
    </footer>
  )
}
