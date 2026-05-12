import './HeroCardStack.css'

export default function HeroCardStack() {
  return (
    <div className="card-stack">
      {/* TV Card */}
      <article className="float-card card-tv">
        <div className="card-chip chip-tv">
          <span className="icon-tv" />
        </div>
        <div className="card-label">Smart TV</div>
        <div className="card-title">TV Repair<br />&amp; Diagnostics</div>
        <div className="card-price">₹349 <span>onwards</span></div>
        <div className="card-meta">
          <span className="meta-dot" />
          <span>Express visit · 45 min</span>
        </div>
      </article>

      {/* AC Card */}
      <article className="float-card card-ac">
        <div className="most-booked">Most booked</div>
        <div className="card-chip chip-ac">
          <span className="icon-ac" />
        </div>
        <div className="card-label">Air Conditioner</div>
        <div className="card-title">AC Service &amp;<br />Gas Refill</div>
        <div className="card-price">₹599 <span>onwards</span></div>
        <div className="card-meta">
          <span className="meta-dot" />
          <span>Available today · 90 min</span>
        </div>
      </article>

      {/* Washing Machine Card */}
      <article className="float-card card-wm">
        <div className="card-chip chip-wm">
          <span className="icon-wm" />
        </div>
        <div className="card-label">Washing Machine</div>
        <div className="card-title">Full Service<br />&amp; Repair</div>
        <div className="card-price">₹449 <span>onwards</span></div>
        <div className="card-meta">
          <span className="meta-dot" />
          <span>Same day · 60 min</span>
        </div>
      </article>

      {/* Rating Card */}
      <div className="rating-card">
        <div className="rating-number">4.9</div>
        <div className="rating-text">
          <div className="stars" style={{ margin: '0 0 4px 0' }}>★★★★★</div>
          <div>2,400+ ratings</div>
        </div>
      </div>
    </div>
  )
}
