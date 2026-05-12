import './Testimonial.css'

export default function Testimonial() {
  return (
    <section className="section testimonial-section">
      <div className="container">
        <div className="testimonial">
          <p>
            "I was quoted ₹3,200 for an AC gas refill. ServiceOne told me the fair
            range in my area was ₹750–₹950. I called a different provider and paid
            ₹850. That is the kind of tool every household needs."
          </p>
          <div className="author">
            <div className="author-avatar" aria-hidden="true">RK</div>
            <div className="author-meta">
              <strong>Ramesh Kumar</strong>
              <span>Bhubaneshwar, Odisha</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
