import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ServicesPage from './pages/ServicesPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'
import { GoogleOAuthProvider } from '@react-oauth/google'

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/result/live" element={<ResultPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
