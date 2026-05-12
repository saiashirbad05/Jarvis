'use client'

import React, { useState } from 'react'
import Header from '../../components/layout-next/Header'
import Footer from '../../components/layout-next/Footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // { success: boolean, message: string }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
    try {
      const response = await fetch(`${apiBase}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (response.ok && result.ok) {
        setStatus({
          success: true,
          message: '✨ Sent'
        })
        setFormData({ name: '', phone: '', email: '', message: '' })
      } else {
        setStatus({
          success: false,
          message: result.detail || 'Failed to submit form. Please try again.'
        })
      }
    } catch (error) {
      console.error('Contact submission error:', error)
      setStatus({
        success: false,
        message: 'Unable to connect to the backend server. Please verify the backend is running on port 8000.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="mobile-padding-reduce" style={{ backgroundColor: '#f8fafc', minHeight: '80vh', padding: '4rem 1rem' }}>
        <div className="container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Creator Box */}
          <div className="creator-padding" style={{ backgroundColor: 'white', borderRadius: '20px', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.01)', border: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.025em' }}>Meet the Creator</h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>The mind behind ServiceOne's transparent pricing revolution.</p>
            </div>

            <div className="responsive-grid-2col" style={{ gap: '3rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src="/creator.png" 
                  alt="SAI ASHIRBAD BEHERA - Founder of ServiceOne" 
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center 15%', borderRadius: '24px', backgroundColor: '#eff6ff', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}
                />
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: '#eb5b31', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>FOUNDER & CEO</div>
              </div>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>SAI ASHIRBAD BEHERA</h2>
                <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.7, fontSize: '1.05rem' }}>
                  A visionary tech entrepreneur and Passionate AI Generalist based in Odisha. Sai built ServiceOne to solve a real-world problem: the lack of transparency in the appliance repair industry. 
                  By leveraging advanced AI and real-time market data, he is empowering thousands of households to make informed decisions and save money.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#1e293b', fontWeight: 600 }}>
                    <span style={{ fontSize: '1.25rem', backgroundColor: '#fef2f2', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>📧</span> saiashirbadbehera2@gmail.com
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#1e293b', fontWeight: 600 }}>
                    <span style={{ fontSize: '1.25rem', backgroundColor: '#eff6ff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>📍</span> Bhubaneswar, Odisha, India
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Box (Under Creator Box) */}
          <div className="creator-padding" style={{ backgroundColor: 'white', borderRadius: '20px', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.01)', border: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Contact Us</h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Send us your thoughts, queries, or partnership ideas. We will get back to you immediately.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="responsive-grid-2col" style={{ gap: '1.5rem' }}>
                {/* Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="name" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#eb5b31'
                      e.target.style.boxShadow = '0 0 0 3px rgba(235, 91, 49, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="phone" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#eb5b31'
                      e.target.style.boxShadow = '0 0 0 3px rgba(235, 91, 49, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Email / Gmail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Gmail / Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="yourname@gmail.com"
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#eb5b31'
                    e.target.style.boxShadow = '0 0 0 3px rgba(235, 91, 49, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="message" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    minHeight: '100px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#eb5b31'
                    e.target.style.boxShadow = '0 0 0 3px rgba(235, 91, 49, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Feedback Status Alert */}
              {status && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  backgroundColor: status.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${status.success ? '#bbf7d0' : '#fecaca'}`,
                  color: status.success ? '#166534' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {status.success ? '✓' : '⚠'} {status.message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: '#eb5b31',
                  color: 'white',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(235, 91, 49, 0.3), 0 4px 6px -2px rgba(235, 91, 49, 0.05)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '0.5rem'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#d44d24'
                    e.target.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#eb5b31'
                    e.target.style.transform = 'translateY(0)'
                  }
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} viewBox="0 0 24 24" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </form>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
