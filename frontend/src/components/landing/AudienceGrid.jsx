import './AudienceGrid.css'

export default function AudienceGrid() {
  return (
    <section className="section audience-section">
      <div className="container">
        <div className="eyebrow">Who is this for?</div>
        <h2 className="section-title">Built for every household that deserves a fair deal</h2>
        
        <div className="audience-two-column-grid">
          
          {/* Card 1: Air Conditioner */}
          <article className="premium-service-showcase">
            <div className="showcase-image-wrapper">
              <img 
                src="/ac_cooling_breeze.png" 
                alt="Air Conditioner Service" 
                className="showcase-img ac-showcase-img"
              />
              <div className="showcase-overlay" />
              <div className="showcase-badge">Climate Control</div>
            </div>
            <div className="showcase-content">
              <h3>⚡ Air Conditioner (AC) Services</h3>
              <p>
                Get authentic cost analysis for split & window AC installations, gas charging (R22/R32/R410), PCB diagnostics, and compressor replacements. Know the market average before hiring.
              </p>
              <div className="showcase-bullets">
                <span>💨 Gas Refill</span>
                <span>🛠️ Leakage Repair</span>
                <span>🔌 PCB Fixes</span>
              </div>
            </div>
          </article>

          {/* Card 2: Washing Machine */}
          <article className="premium-service-showcase">
            <div className="showcase-image-wrapper">
              <img 
                src="/washing_machine_service_banner.png" 
                alt="Washing Machine Repair" 
                className="showcase-img"
              />
              <div className="showcase-overlay" />
              <div className="showcase-badge">Appliance Care</div>
            </div>
            <div className="showcase-content">
              <h3>🌀 Washing Machine Repair</h3>
              <p>
                Verify quotes for front-load, top-load, and semi-automatic models. Get instant fair-pricing verification for drum bearings, intake valves, drain motors, and motherboard malfunctions.
              </p>
              <div className="showcase-bullets">
                <span>🔄 Drum & Spin</span>
                <span>⚙️ Motor Care</span>
                <span>🔋 Motherboard Fix</span>
              </div>
            </div>
          </article>

        </div>
      </div>
    </section>
  )
}
