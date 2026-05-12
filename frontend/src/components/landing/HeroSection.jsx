import { useRouter } from 'next/navigation'
import HeroCardStack from './HeroCardStack'
import './HeroSection.css'

export default function HeroSection() {
  const router = useRouter()


  return (
    <section className="hero">
      <div className="container hero-grid">
        {/* Left column */}
        <div className="hero-left">
          <div className="hero-badge">
            Trusted by 3,000+ households checking quotes
          </div>

          <h2 className="hero-title">
            Know the<br />
            fair price<br />
            <span className="accent">before you pay.</span>
          </h2>

          <p className="hero-copy">
            Enter your appliance, service type, and the quoted amount.
            We check it against real local market data and give you a clear
            verdict in seconds — no sign-up needed.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = '/services/'}
              id="hero-cta-check"
            >
              Check a quote now
            </button>
            <button className="btn btn-secondary" id="hero-cta-how">
              How it works
            </button>
          </div>

          <div className="hero-meta">
            <span className="stars">★★★★★</span>
            <span>4.9/5 from 2,400+ reviews · Serving tier-2 &amp; tier-3 India</span>
          </div>
        </div>

        {/* Right column — floating cards */}
        <div className="hero-visual">
          <HeroCardStack />
        </div>
      </div>
    </section>
  )
}
