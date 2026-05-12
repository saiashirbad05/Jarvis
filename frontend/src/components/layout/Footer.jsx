import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="logo" to="/">
              <span className="logo-dot" />
              <span>ServiceOne</span>
            </Link>
            <p>
              Know the fair price before you pay. Transparent quote checking for
              Indian home appliance repair and installation services.
            </p>
          </div>

          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              <li><Link to="#">AC Services</Link></li>
              <li><Link to="#">AC Gas Refill</Link></li>
              <li><Link to="#">TV Repair</Link></li>
              <li><Link to="#">Washing Machine</Link></li>
              <li><Link to="#">Geyser Repair</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link to="#">About us</Link></li>
              <li><Link to="#">How it works</Link></li>
              <li><Link to="/community">Community Reports</Link></li>
              <li><Link to="#">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link to="#">Contact</Link></li>
              <li><Link to="#">FAQs</Link></li>
              <li><Link to="#">Privacy Policy</Link></li>
              <li><Link to="#">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 ServiceOne. All rights reserved.</span>
          <span>Made with care in India</span>
        </div>
      </div>
    </footer>
  )
}
