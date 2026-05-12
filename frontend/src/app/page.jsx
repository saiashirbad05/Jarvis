'use client'

import Header from '../components/layout-next/Header'
import Footer from '../components/layout-next/Footer'
import HeroSection from '../components/landing/HeroSection'
import ServiceTicker from '../components/landing/ServiceTicker'
import AudienceGrid from '../components/landing/AudienceGrid'
import PricingGrid from '../components/landing/PricingGrid'
import Testimonial from '../components/landing/Testimonial'
import ClosingCTA from '../components/landing/ClosingCTA'

export default function LandingPage() {
  return (
    <div className="homepage-style-context">
      <Header />
      <main>
        <HeroSection />
        <ServiceTicker />
        <AudienceGrid />
        <PricingGrid />
        <Testimonial />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  )
}
