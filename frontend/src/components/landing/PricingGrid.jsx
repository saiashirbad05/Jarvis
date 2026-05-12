import { useRouter } from 'next/navigation'
import './PricingGrid.css'

const PLANS = [
  {
    id: 'ac',
    title: 'AC Services',
    sub: 'Split & Window AC',
    amount: '₹599',
    note: 'Standard service visit',
    features: [
      'Filter cleaning and coil wash',
      'Gas pressure check',
      'Thermostat calibration',
      '30-day service warranty',
    ],
    cta: 'Check AC quote',
    featured: false,
  },
  {
    id: 'tv',
    title: 'TV Repair',
    sub: 'LED, OLED & Smart TVs',
    amount: '₹349',
    note: 'Diagnostics + repair quote',
    features: [
      'Free diagnostics visit',
      'Panel and backlight repair',
      'PCB and power board fix',
      '90-day repair warranty',
    ],
    cta: 'Check TV quote',
    featured: true,
  },
  {
    id: 'wm',
    title: 'Washing Machine',
    sub: 'Front & Top Load',
    amount: '₹449',
    note: 'Standard repair visit',
    features: [
      'Motor and pump repair',
      'Drum and bearing fix',
      'Board and wiring check',
      '60-day repair warranty',
    ],
    cta: 'Check WM quote',
    featured: false,
  },
]

export default function PricingGrid() {
  const router = useRouter()

  return (
    <section className="section pricing-section">
      <div className="container">
        <div className="eyebrow">Transparent pricing</div>
        <h2 className="section-title">No hidden charges. Ever.</h2>
        <p className="section-copy" style={{ marginTop: 12 }}>
          See what a fair quote looks like before you talk to any provider.
        </p>

        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`price-card${plan.featured ? ' featured' : ''}`}
              id={`pricing-${plan.id}`}
            >
              {plan.featured && <div className="popular-tag">Most popular</div>}
              <h3 className="price-title">{plan.title}</h3>
              <p className="price-sub">{plan.sub}</p>
              <div className="amount">{plan.amount}</div>
              <p className="price-note">{plan.note}</p>
              <ul className="feature-list">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className={`btn ${plan.featured ? 'btn-white' : 'btn-secondary'}`}
                onClick={() => router.push('/services')}
                id={`pricing-cta-${plan.id}`}
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
