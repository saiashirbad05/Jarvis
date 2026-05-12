import { useRouter } from 'next/navigation'
import './ClosingCTA.css'

export default function ClosingCTA() {
  const router = useRouter()

  return (
    <section className="section closing-section">
      <div className="container">
        <div className="cta-box">
          <div className="cta-text">
            <h2>Check your quote<br />before you pay.</h2>
            <p>No sign-up needed. Just your city, appliance, and the quoted price.</p>
          </div>
          <button
            className="btn btn-cta-white"
            onClick={() => window.location.href = '/services/'}
            id="closing-cta-btn"
          >
            Check a quote now
          </button>
        </div>
      </div>
    </section>
  )
}
