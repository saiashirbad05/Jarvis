import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function ContactPage() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#f8fafc', minHeight: '80vh', padding: '4rem 1rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Contact Us</h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Have questions? We are here to help you get the best service.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src="/creator.png" 
                  alt="SAI ASHIRBAD BEHERA - Founder of ServiceOne" 
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center 15%', borderRadius: '24px', backgroundColor: '#eff6ff', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: '#3b82f6', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>FOUNDER & CEO</div>
              </div>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>SAI ASHIRBAD BEHERA</h2>
                <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.7, fontSize: '1.05rem' }}>
                  A visionary tech entrepreneur and Passionate AI Generalist based in Odisha. Sai built ServiceOne to solve a real-world problem: the lack of transparency in the appliance repair industry. 
                  By leveraging advanced AI and real-time market data, he is empowering thousands of households to make informed decisions and save money.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#1e293b', fontWeight: 600 }}>
                    <span style={{ fontSize: '1.25rem' }}>📧</span> saiashirbadbehera2@gmail.com
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#1e293b', fontWeight: 600 }}>
                    <span style={{ fontSize: '1.25rem' }}>📍</span> Bhubaneswar, Odisha, India
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
