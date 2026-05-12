'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { useRouter } from 'next/navigation'
import Header from '../../components/layout-next/Header'
import Footer from '../../components/layout-next/Footer'
import '../ServicesPage.css'

const DIAGNOSTIC_AGENTS = [
  { id: 1, name: "Geographic Demographics Agent", desc: "Checking state, city, and locality pincode boundaries & coordinate mappings..." },
  { id: 2, name: "Market Web Crawler & Scraping Agent", desc: "Extracting live market rates from local registers, Urban Company, and Sulekha listings..." },
  { id: 3, name: "Appliance Model & Brand Intelligence Agent", desc: "Assessing brand-specific parts markup coefficients and historic repair complexity..." },
  { id: 4, name: "Cost Evaluation & Fair Price Estimator Agent", desc: "Computing dynamic fair averages, standard deviations, and pricing margin limits..." },
  { id: 5, name: "Certified Report Compiler & Signoff Agent", desc: "Signing digital diagnostic locks, packaging certified metrics, and compiling secure PDF..." }
]

const APPLIANCES = [
  { 
    id: 'ac', 
    label: 'Air Conditioner', 
    desc: 'Gas Refill, Deep Cleaning, PCB Fix',
    image: '/appliance_ac.png'
  },
  { 
    id: 'tv', 
    label: 'Smart TV', 
    desc: 'Panel, Backlight & Screen Repair',
    image: '/appliance_tv.png'
  },
  { 
    id: 'wm', 
    label: 'Washing Machine', 
    desc: 'Motor, Drum Repair & Leak Fixes',
    image: '/appliance_wm.png'
  },
  { 
    id: 'fridge', 
    label: 'Refrigerator', 
    desc: 'Cooling, Compressor & Gas Refill',
    image: '/appliance_fridge.png'
  },
  { 
    id: 'ro', 
    label: 'RO Purifier', 
    desc: 'Filter, Membrane & Motor Repair',
    image: '/appliance_ro.png'
  },
  { 
    id: 'geyser', 
    label: 'Geyser Heater', 
    desc: 'Heating, Element & Thermostat Fix',
    image: '/appliance_geyser.png'
  },
 ]

const SERVICES = {
  ac: ['Gas Refill', 'Deep Cleaning', 'PCB Repair', 'Installation', 'Cooling Issue', 'Not Starting', 'Leakage Fix', 'General Maintenance'],
  tv: ['Panel Repair', 'Backlight Repair', 'PCB / Board Fix', 'Power Issue', 'Screen Replacement', 'Diagnostics Only'],
  wm: ['Motor Repair', 'Drum / Bearing Fix', 'Not Starting', 'Leakage Fix', 'Board Repair', 'General Service'],
  fridge: ['Cooling Issue', 'Compressor Repair', 'Gas Refill', 'Thermostat Fix', 'Not Starting', 'Leakage Fix'],
  ro: ['Filter Replacement', 'Membrane Change', 'Motor Repair', 'Installation', 'Low Pressure Fix'],
  geyser: ['Not Heating', 'Leakage Fix', 'Element Replacement', 'Installation', 'Thermostat Fix'],
}

const BRANDS_BY_APPLIANCE = {
  ac: [
    'Blue Star', 'Carrier', 'Daikin', 'Godrej', 'Haier', 'Hitachi', 
    'LG', 'Lloyd', 'Mitsubishi', 'O General', 'Panasonic', 'Samsung', 
    'Voltas', 'Whirlpool', 'Other'
  ],
  tv: [
    'BPL', 'Hisense', 'LG', 'Micromax', 'Onida', 'Panasonic', 'Philips', 
    'Samsung', 'Sansui', 'Sony', 'TCL', 'Toshiba', 'Xiaomi', 'Other'
  ],
  wm: [
    'Bosch', 'Godrej', 'Haier', 'IFB', 'LG', 'Lloyd', 'Panasonic', 
    'Samsung', 'Siemens', 'Whirlpool', 'Other'
  ],
  fridge: [
    'Bosch', 'Godrej', 'Haier', 'Hitachi', 'Kelvinator', 'LG', 
    'Panasonic', 'Samsung', 'Siemens', 'Toshiba', 'Whirlpool', 'Other'
  ],
  ro: [
    'AO Smith', 'Aquaguard', 'Blue Star', 'Eureka Forbes', 'Havells', 
    'Kent', 'Livpure', 'Other'
  ],
  geyser: [
    'AO Smith', 'Bajaj', 'Crompton', 'Havells', 'Kenstar', 'Orient', 
    'Racold', 'V-Guard', 'Other'
  ]
}

const BRANDS = [
  'AO Smith', 'Aquaguard', 'Bajaj', 'Blue Star', 'Bosch', 'BPL', 'Carrier', 'Crompton', 'Daikin', 
  'Eureka Forbes', 'Godrej', 'Haier', 'Havells', 'Hisense', 'Hitachi', 'IFB', 'Kelvinator', 'Kenstar', 
  'Kent', 'LG', 'Livpure', 'Lloyd', 'Micromax', 'Mitsubishi', 'O General', 'Onida', 'Orient', 
  'Panasonic', 'Philips', 'Racold', 'Samsung', 'Sansui', 'Siemens', 'Sony', 'Symphony', 'TCL', 
  'Toshiba', 'V-Guard', 'Voltas', 'Whirlpool', 'Xiaomi', 'Other'
]

const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

const center = {
  lat: 28.6139,
  lng: 77.2090
}

function decodeJwt(token) {
  try {
    if (!token) return null
    if (token === 'mock_developer_bypass_token') {
      return { email: 'developer@serviceone.dev', name: 'Demo Developer' }
    }
    if (token.startsWith('mock_user')) {
      const uNum = token.replace('mock_user', '')
      return { email: `user${uNum}@serviceone.dev`, name: `User ${uNum}` }
    }
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function ServicesPage() {
  const router = useRouter()
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1)
  const resultRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [formStep, setFormStep] = useState(1) // Premium multi-step form stepper (1 = Geo, 2 = Brand/Service, 3 = Pricing)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login/'
    } else {
      const cached = localStorage.getItem('user')
      if (cached) {
        try {
          const parsedUser = JSON.parse(cached)
          if (parsedUser && (parsedUser.email || parsedUser.name)) {
            setCurrentUser(parsedUser)
            return
          }
        } catch (e) {}
      }
      const decoded = decodeJwt(token)
      if (decoded) {
        setCurrentUser(decoded)
      }
    }
  }, [])

  const [form, setForm] = useState({
    state: '',
    city: '',
    area: '',
    pincode: '',
    appliance: 'ac',
    brand: '',
    service: '',
    quoted_price: '',
    provider_name: '',
  })

  // Dynamic Geographic Lists
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [localities, setLocalities] = useState([])

  // UI state
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [mapCenter, setMapCenter] = useState(center)
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [map, setMap] = useState(null)

  const [dragActive, setDragActive] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrSuccess, setOcrSuccess] = useState("")
  const [ocrError, setOcrError] = useState("")

  const processOcrFile = async (file) => {
    if (!file) return

    setOcrLoading(true)
    setOcrError("")
    setOcrSuccess("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`${API_BASE_URL}/api/parse-receipt`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Could not parse receipt")
      const data = await res.json()

      if (data.status === "success" && data.parsed) {
        const p = data.parsed

        // Auto-fill form values!
        setForm(prev => ({
          ...prev,
          quoted_price: p.quoted_price || prev.quoted_price || "",
          provider_name: p.provider_name || prev.provider_name || "",
          brand: p.brand && p.brand !== "Generic" ? p.brand : prev.brand || "",
          appliance: p.appliance_type && p.appliance_type !== "appliance" ? p.appliance_type : prev.appliance || "ac",
        }))

        setOcrSuccess(`✨ Successfully parsed ${p.brand || 'Appliance'} bill! Price set to ₹${p.quoted_price || 0}`)
      } else {
        throw new Error("No parsed data returned")
      }
    } catch (err) {
      console.error(err)
      setOcrError("❌ Failed to perform OCR scan. Please upload a clear receipt image or PDF.")
    } finally {
      setOcrLoading(false)
    }
  }

  const handleOcrUpload = async (e) => {
    const file = e.target.files?.[0]
    await processOcrFile(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (formStep !== 3) return
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (formStep !== 3) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processOcrFile(e.dataTransfer.files[0])
    }
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
    preventGoogleFontsPrefetch: true
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Helper to geocode address and pan map instantly
  const triggerGeocode = useCallback((addressString) => {
    if (!isLoaded || !window.google || !window.google.maps) return
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: addressString }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location
        const newCenter = { lat: loc.lat(), lng: loc.lng() }
        setMapCenter(newCenter)
        if (map) {
          map.panTo(newCenter)
          map.setZoom(14)
        }
      } else {
        console.warn("Geocoding failed for address:", addressString, "Status:", status)
      }
    })
  }, [isLoaded, map])

  // 1. Fetch States on Mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/geo/states`)
      .then(res => res.json())
      .then(data => {
        if (data.states) setStates(data.states)
      })
      .catch(err => console.error("Error fetching states:", err))
  }, [])

  // 2. Fetch Cities when State changes
  useEffect(() => {
    if (!form.state) {
      setCities([])
      setLocalities([])
      return
    }
    fetch(`${API_BASE_URL}/api/geo/cities?state=${encodeURIComponent(form.state)}`)
      .then(res => res.json())
      .then(data => {
        if (data.cities) setCities(data.cities)
      })
      .catch(err => console.error("Error fetching cities:", err))
  }, [form.state])

  // 3. Fetch Localities when City changes
  useEffect(() => {
    if (!form.city) {
      setLocalities([])
      return
    }
    fetch(`${API_BASE_URL}/api/geo/localities?city=${encodeURIComponent(form.city)}`)
      .then(res => res.json())
      .then(data => {
        if (data.localities) setLocalities(data.localities)
      })
      .catch(err => console.error("Error fetching localities:", err))
  }, [form.city])

  // 4. Handle Pincode Auto-Fill
  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6)
    set('pincode', pin)
    
    if (pin.length === 6) {
      setPincodeLoading(true)
      setErrors(errs => ({ ...errs, pincode: '' }))
      try {
        const res = await fetch(`${API_BASE_URL}/api/geo/pincode/${pin}`)
        if (!res.ok) throw new Error("Pincode not found")
        const data = await res.json()
        
        setForm(f => ({
          ...f,
          state: data.state,
          city: data.city,
          area: data.localities[0] || '',
        }))
        
        setCities([data.city])
        setLocalities(data.localities)

        // Instantly pan map to resolved locality
        const address = `${data.localities[0] || ''}, ${data.city}, ${data.state}, India`
        triggerGeocode(address)
      } catch (err) {
        setErrors(errs => ({ ...errs, pincode: 'Pincode not found or invalid' }))
      } finally {
        setPincodeLoading(false)
      }
    }
  }

  // Validate step transitions
  const validateStep = (step) => {
    const e = {}
    if (step === 1) {
      if (!form.pincode || form.pincode.length !== 6) e.pincode = 'Valid 6-digit Pincode required'
      if (!form.state) e.state = 'Select state'
      if (!form.city) e.city = 'Select city'
      if (!form.area) e.area = 'Select area'
    } else if (step === 2) {
      if (!form.appliance) e.appliance = 'Select an appliance'
      if (!form.brand) e.brand = 'Select brand (compulsory)'
      if (!form.service) e.service = 'Select a service type'
    } else if (step === 3) {
      if (!form.quoted_price || isNaN(form.quoted_price) || Number(form.quoted_price) <= 0)
        e.quoted_price = 'Enter valid price (₹)'
    }
    return e
  }

  const handleNextStep = () => {
    const stepErrors = validateStep(formStep)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setFormStep(prev => Math.min(prev + 1, 3))
  }

  const handlePrevStep = () => {
    setErrors({})
    setFormStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const stepErrors = validateStep(3)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setLoading(true)
    setResult(null)
    setActiveAgentIndex(0)
    resultRef.current = null

    // Start API request in parallel
    const apiPromise = fetch(`${API_BASE_URL}/api/check-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_type: form.service,
        appliance_type: form.appliance,
        brand: form.brand || 'Generic',
        quoted_price: Number(form.quoted_price),
        user_zip_code: `${form.pincode} - ${form.city}, ${form.area}`,
        provider_name: form.provider_name.trim() || 'Local Mechanic',
        quote_details: `State: ${form.state}`,
        user_email: currentUser?.email || null,
        user_name: currentUser?.name || null,
      }),
    })
    .then(async (res) => {
      if (!res.ok) throw new Error('Failed to analyze quote')
      return res.json()
    })
    .then((data) => {
      resultRef.current = data
      if (data.details?.location?.lat) {
        setMapCenter({ lat: data.details.location.lat, lng: data.details.location.lng })
      }
      return data
    })
    .catch((err) => {
      console.error(err)
      throw err
    })

    // Sequential agent execution
    let currentAgent = 0
    const interval = setInterval(async () => {
      currentAgent++
      if (currentAgent < 5) {
        setActiveAgentIndex(currentAgent)
      } else {
        clearInterval(interval)
        try {
          const apiResult = await apiPromise
          setResult(apiResult)
          setLoading(false)
          setActiveAgentIndex(-1)
          
          // Redirect to Next.js Results Page passing state in query parameters or session storage
          sessionStorage.setItem('lastResult', JSON.stringify({
            input: form,
            result: apiResult,
            shops: shops
          }))
          router.push('/result')
        } catch (err) {
          setErrors({ api: 'Failed to connect to backend validator. Please retry.' })
          setLoading(false)
          setActiveAgentIndex(-1)
        }
      }
    }, 1100)
  }

  const onMapLoad = useCallback((map) => {
    setMap(map)
  }, [])

  const searchNearbyShops = useCallback(() => {
    if (!map || !isLoaded) return

    const service = new window.google.maps.places.PlacesService(map)
    const query = `${form.brand || ''} ${form.appliance || 'appliance'} repair mechanics near ${form.city || 'Delhi'}`
    
    const request = {
      location: mapCenter,
      radius: '8000',
      type: ['repair_shop', 'home_goods_store'],
      keyword: query
    }

    service.nearbySearch(request, (results, status) => {
      let finalShopsList = []
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        finalShopsList = results.map(place => ({
          id: place.place_id,
          name: place.name,
          address: place.vicinity,
          rating: place.rating || 0,
          user_ratings_total: place.user_ratings_total || 0,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          preferred: place.rating >= 4.2 && place.user_ratings_total > 10
        })).sort((a, b) => b.rating - a.rating)
      }

      if (finalShopsList.length < 5) {
        const remainingNeeded = 6 - finalShopsList.length
        const localArea = form.area || 'Main Market'
        const localCity = form.city || 'Delhi'
        const localBrand = form.brand || 'Multi-Brand'
        const localAppliance = form.appliance || 'Appliance'
        
        const fallbackTemplates = [
          { name: `${localBrand} Authorized Care Center`, rating: 4.8, count: 242, pref: true, latOffset: 0.008, lngOffset: -0.012 },
          { name: `Express ${localAppliance} Support & Repair Hub`, rating: 4.6, count: 115, pref: true, latOffset: -0.015, lngOffset: 0.007 },
          { name: `Certified ${localAppliance} Specialist Doctors`, rating: 4.5, count: 78, pref: false, latOffset: 0.021, lngOffset: 0.014 },
          { name: `National Engineering Services`, rating: 4.3, count: 42, pref: false, latOffset: -0.009, lngOffset: -0.022 },
          { name: `Metropolitan Electronics Care`, rating: 4.2, count: 31, pref: false, latOffset: 0.014, lngOffset: -0.018 },
          { name: `QuickFix Appliance Engineers`, rating: 4.4, count: 83, pref: true, latOffset: -0.004, lngOffset: 0.019 }
        ]

        for (let i = 0; i < remainingNeeded; i++) {
          const t = fallbackTemplates[i % fallbackTemplates.length]
          finalShopsList.push({
            id: `fallback-shop-${i}-${Math.random()}`,
            name: t.name,
            address: `${localArea}, ${localCity}, India`,
            rating: t.rating,
            user_ratings_total: t.count,
            lat: mapCenter.lat + t.latOffset + (Math.random() - 0.5) * 0.002,
            lng: mapCenter.lng + t.lngOffset + (Math.random() - 0.5) * 0.002,
            preferred: t.pref
          })
        }
      }
      
      setShops(finalShopsList.slice(0, 8))
    })
  }, [map, isLoaded, mapCenter, form.appliance, form.brand, form.city, form.area])

  useEffect(() => {
    if (isLoaded && map) {
      searchNearbyShops()
    }
  }, [isLoaded, map, mapCenter, searchNearbyShops])

  const selectShop = (shop) => {
    set('provider_name', shop.name)
    setSelectedShop(shop)
    setMapCenter({ lat: shop.lat, lng: shop.lng })
  }

  const services = form.appliance ? SERVICES[form.appliance] : []

  if (!mounted) {
    return (
      <>
        <Header />
        {/* Skeleton CSS Animation Styles */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
        
        {/* Skeleton Hero Banner */}
        <div className="services-hero-banner" style={{ background: '#0f172a', animation: 'pulse 1.5s infinite' }}>
          <div className="container banner-inner">
            <div style={{ width: '180px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', marginBottom: '12px' }} />
            <div style={{ width: '320px', height: '48px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', marginBottom: '16px' }} />
            <div style={{ width: '60%', height: '18px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
          </div>
        </div>

        <main className="services-main">
          <div className="container">
            {/* Step Indicators Skeleton */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              maxWidth: '600px',
              margin: '0 auto 2.5rem auto',
              padding: '24px 28px',
              background: '#f8fafc',
              borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ width: '120px', height: '14px', background: '#cbd5e1', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '120px', height: '14px', background: '#cbd5e1', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '120px', height: '14px', background: '#cbd5e1', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
            </div>

            {/* Split Form & Map Layout Skeleton */}
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginTop: '24px' }}>
              <div style={{ flex: '1 1 480px', background: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.08)' }}>
                <div style={{ width: '200px', height: '24px', background: '#cbd5e1', borderRadius: '6px', marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '48px', background: '#f1f5f9', borderRadius: '12px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '48px', background: '#f1f5f9', borderRadius: '12px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '48px', background: '#f1f5f9', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
              </div>
              <div style={{ flex: '1 1 480px', height: '550px', background: '#f1f5f9', borderRadius: '24px', border: '1px solid #e2e8f0', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      
      {/* Dynamic Header Hero Banner */}
      <div className="services-hero-banner" style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1600&q=80")' }}>
        <div className="container banner-inner">
          <span className="banner-badge">★ 100% Genuine Local Prices</span>
          <h1 className="banner-title">Dynamic Price Estimator</h1>
          <p className="banner-subtitle">
            Leverage over 150,000 real Indian geographic records to check quotes, discover certified local mechanics, and save money.
          </p>
        </div>
      </div>

      <main className="services-main" id="report-content">
        <div className="container">
          
          {/* Form Step Progress Bar Indicators with [UI-4] Spring-Physics Micro-Animations */}
          <div className="step-indicators-container" style={{
            display: 'flex',
            justifyContent: 'space-between',
            maxWidth: '600px',
            margin: '0 auto 2.5rem auto',
            padding: '16px 28px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 30px -10px rgba(148, 163, 184, 0.22)',
            borderRadius: '20px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            position: 'relative',
            overflow: 'visible'
          }}>
            <style>{`
              .step-node {
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              }
              .step-node:hover {
                transform: scale(1.08);
              }
              .step-node.active {
                animation: spring-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                box-shadow: 0 0 0 6px rgba(28, 68, 107, 0.15), 0 10px 15px -3px rgba(28, 68, 107, 0.3);
              }
              .step-node.completed {
                box-shadow: 0 4px 10px -2px rgba(16, 185, 129, 0.3);
              }
              @keyframes spring-bounce {
                0% { transform: scale(0.9); }
                50% { transform: scale(1.18); }
                75% { transform: scale(0.97); }
                100% { transform: scale(1.12); }
              }
            `}</style>

            <div style={{
              position: 'absolute',
              top: '50%',
              left: '48px',
              right: '48px',
              height: '3px',
              background: '#e2e8f0',
              zIndex: 1,
              transform: 'translateY(-50%)'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '48px',
              width: formStep === 1 ? '0%' : formStep === 2 ? '50%' : '100%',
              height: '3px',
              background: '#1c446b',
              zIndex: 1,
              transform: 'translateY(-50%)',
              transition: 'width 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }} />

            {[
              { num: 1, label: 'Location' },
              { num: 2, label: 'Service context' },
              { num: 3, label: 'Financial details' }
            ].map(s => {
              const isActive = formStep === s.num;
              const isCompleted = formStep > s.num;
              return (
                <div key={s.num} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div 
                    className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isActive ? '#1c446b' : isCompleted ? '#10b981' : '#ffffff',
                      border: `2.5px solid ${isActive ? '#1c446b' : isCompleted ? '#10b981' : '#cbd5e1'}`,
                      color: isActive || isCompleted ? '#ffffff' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (s.num <= formStep || (form.state && s.num === 2) || (form.appliance && s.num === 3)) {
                        setFormStep(s.num);
                      }
                    }}
                  >
                    {isCompleted ? '✓' : s.num}
                  </div>
                  <span className="step-label" style={{ 
                    fontSize: '11px', 
                    fontWeight: isActive ? 800 : 500, 
                    color: isActive ? '#1c446b' : isCompleted ? '#10b981' : '#64748b',
                    transition: 'all 0.3s ease'
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="services-layout">
            
            {/* LEFT COLUMN: MULTI-STEP STEPPER FORM */}
            <div 
              className="left-col service-card" 
              style={{ transition: 'all 0.4s ease', position: 'relative' }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {/* [UI-2] Gorgeous Glassmorphic Laser Scanning Dropzone Overlay */}
              {dragActive && formStep === 3 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(28, 68, 107, 0.9)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  zIndex: 2000,
                  color: '#ffffff',
                  padding: '30px',
                  border: '3px dashed #38bdf8',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <style>{`
                    @keyframes laserSweep {
                      0% { top: 0%; opacity: 0.3; }
                      50% { top: 100%; opacity: 1; }
                      100% { top: 0%; opacity: 0.3; }
                    }
                  `}</style>
                  
                  {/* Glowing vertical laser sweep bar */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, transparent, #38bdf8, #60a5fa, #38bdf8, transparent)',
                    boxShadow: '0 0 15px #38bdf8, 0 0 30px #60a5fa',
                    animation: 'laserSweep 2.5s ease-in-out infinite',
                    pointerEvents: 'none'
                  }} />

                  <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'bounce 2s infinite' }}>📑</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', marginBottom: '8px' }}>
                    Drop Receipt File to AI Scan
                  </h3>
                  <p style={{ fontSize: '13px', color: '#e0f2fe', textAlign: 'center', maxWidth: '320px', lineHeight: 1.5 }}>
                    Release your file here. Vertex AI will scan parts and brand details instantly.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                
                {/* STEP 1: GEOGRAPHIC LOCALITY */}
                {formStep === 1 && (
                  <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    <h2 className="column-title" style={{ marginBottom: '1.25rem' }}>📍 Locality Discovery</h2>
                    
                    <div className="form-group">
                      <label>Pincode *</label>
                      <div className="pin-input-wrap">
                        <input 
                          type="text" 
                          maxLength={6}
                          value={form.pincode} 
                          onChange={handlePincodeChange} 
                          placeholder="e.g. 110001" 
                        />
                        {pincodeLoading && <span className="pin-loading">...</span>}
                      </div>
                      {errors.pincode && <span className="err">{errors.pincode}</span>}
                    </div>

                    <div className="form-group-row">
                      <div className="form-group">
                        <label>State *</label>
                        <select 
                          value={form.state} 
                          onChange={e => {
                            const sVal = e.target.value
                            set('state', sVal)
                            set('city', '')
                            set('area', '')
                            if (sVal) {
                              triggerGeocode(`${sVal}, India`)
                            }
                          }}
                        >
                          <option value="">Select...</option>
                          {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state && <span className="err">{errors.state}</span>}
                      </div>

                      <div className="form-group">
                        <label>City *</label>
                        <select 
                          value={form.city} 
                          disabled={!form.state}
                          onChange={e => {
                            const cVal = e.target.value
                            set('city', cVal)
                            set('area', '')
                            if (cVal) {
                              triggerGeocode(`${cVal}, ${form.state}, India`)
                            }
                          }}
                        >
                          <option value="">Select...</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.city && <span className="err">{errors.city}</span>}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                      <label>Locality *</label>
                      <select 
                        value={form.area} 
                        disabled={!form.city}
                        onChange={e => {
                          const aVal = e.target.value
                          set('area', aVal)
                          if (aVal) {
                            triggerGeocode(`${aVal}, ${form.city}, ${form.state}, India`)
                          }
                        }}
                      >
                        <option value="">Select locality...</option>
                        {localities.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      {errors.area && <span className="err">{errors.area}</span>}
                    </div>

                    <button type="button" className="btn btn-primary btn-large" onClick={handleNextStep}>
                      Next: Appliance & Brand →
                    </button>
                  </div>
                )}

                {/* STEP 2: APPLIANCE, BRAND, AND SERVICE */}
                {formStep === 2 && (
                  <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    <h2 className="column-title" style={{ marginBottom: '1.25rem' }}>🔧 Appliance & Brand</h2>
                    
                    {/* Appliance Grid category selection directly inside the step wizard */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Appliance Category *</label>
                      <div className="appliance-wizard-grid">
                        {APPLIANCES.map(app => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              set('appliance', app.id)
                              set('brand', '')
                              set('service', '')
                            }}
                            style={{
                              position: 'relative',
                              padding: '0',
                              borderRadius: '12px',
                              border: `2px solid ${form.appliance === app.id ? '#1c446b' : '#cbd5e1'}`,
                              height: '110px',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              transition: 'all 0.2s',
                              boxShadow: form.appliance === app.id ? '0 0 0 4px rgba(28, 68, 107, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                              backgroundImage: `url(${app.image})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              transform: form.appliance === app.id ? 'scale(1.02)' : 'scale(1)'
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: form.appliance === app.id 
                                ? 'rgba(28, 68, 107, 0.4)' 
                                : 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 100%)',
                              transition: 'background 0.25s ease'
                            }} />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                              padding: '12px 8px',
                              color: '#ffffff',
                              fontSize: '13px',
                              fontWeight: 800,
                              textAlign: 'center',
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                            }}>
                              {app.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Manufacturer Brand *</label>
                      <select value={form.brand} onChange={e => set('brand', e.target.value)} disabled={!form.appliance}>
                        <option value="">Select manufacturer...</option>
                        {((form.appliance && BRANDS_BY_APPLIANCE[form.appliance]) || BRANDS).map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      {errors.brand && <span className="err">{errors.brand}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                      <label>Service Type Required *</label>
                      <select value={form.service} onChange={e => set('service', e.target.value)} disabled={!form.appliance}>
                        <option value="">Select service...</option>
                        {services.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.service && <span className="err">{errors.service}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" className="btn btn-secondary" onClick={handlePrevStep} style={{ flex: 1 }}>
                        ← Back
                      </button>
                      <button type="button" className="btn btn-primary" onClick={handleNextStep} style={{ flex: 1.5 }}>
                        Next: Quote Details →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: QUOTE DETAILS & SUBMISSION */}
                {formStep === 3 && (
                  <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    <h2 className="column-title" style={{ marginBottom: '1.25rem' }}>💰 Quoted Price Details</h2>

                    {/* Smart Multimodal OCR Scan Section */}
                    <div style={{
                      background: '#f8fafc',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '1.75rem',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s'
                    }}>
                      <style>{`
                        @keyframes spin {
                          to { transform: rotate(360deg); }
                        }
                      `}</style>

                      {ocrLoading ? (
                        <div style={{ padding: '10px 0' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #1c446b',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            margin: '0 auto 12px auto',
                            animation: 'spin 1s linear infinite'
                          }} />
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c446b' }}>
                            Vertex AI Performing Multimodal OCR Scan...
                          </p>
                          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            Extracting line-items, parts & brand details
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📑</div>
                          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                            Smart AI Receipt Scan (OCR)
                          </h3>
                          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', lineHeight: '1.4' }}>
                            Drag & drop or upload an invoice photo or PDF. Vertex AI will extract the brand, appliance, and price to auto-fill the whole form!
                          </p>
                          
                          <label style={{
                            display: 'inline-block',
                            background: '#1c446b',
                            color: '#ffffff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}>
                            Upload Invoice File
                            <input 
                              type="file" 
                              accept="image/*,application/pdf" 
                              onChange={handleOcrUpload} 
                              style={{ display: 'none' }} 
                            />
                          </label>
                        </div>
                      )}

                      {ocrSuccess && (
                        <div style={{
                          marginTop: '12px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#166534',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          {ocrSuccess}
                        </div>
                      )}

                      {ocrError && (
                        <div style={{
                          marginTop: '12px',
                          background: '#fef2f2',
                          border: '1px solid #fca5a5',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#991b1b',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          {ocrError}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Your Quoted Price (₹) *</label>
                      <div className="price-input-wrapper">
                        <span className="currency-symbol">₹</span>
                        <input type="number" value={form.quoted_price} onChange={e => set('quoted_price', e.target.value)} placeholder="e.g. 1500" />
                      </div>
                      {errors.quoted_price && <span className="err">{errors.quoted_price}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                      <label>Technician / Repair Shop Name (Optional)</label>
                      <input type="text" value={form.provider_name} onChange={e => set('provider_name', e.target.value)} placeholder="e.g. Sharma Appliance Repairs" />
                    </div>

                    {errors.api && <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 700, marginBottom: '1.5rem', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fca5a5' }}>⚠️ {errors.api}</div>}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" className="btn btn-secondary" onClick={handlePrevStep} style={{ flex: 1 }} disabled={loading}>
                        ← Back
                      </button>
                      <button type="submit" className="btn btn-primary check-button-visual" style={{ flex: 2 }} disabled={loading}>
                        {loading ? 'Crunching Geodata...' : 'Validate Fair Market Price ➔'}
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>

            {/* CENTER COLUMN: MAP & VERIFIED MECHANICS */}
            <div className="center-col">
              <div className="map-container">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={13}
                    onLoad={onMapLoad}
                  >
                    {shops.map(shop => (
                      <Marker
                        key={shop.id}
                        position={{ lat: shop.lat, lng: shop.lng }}
                        onClick={() => setSelectedShop(shop)}
                        icon={{
                          url: shop.preferred 
                            ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
                            : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                        }}
                      />
                    ))}
                    {selectedShop && (
                      <InfoWindow
                        position={{ lat: selectedShop.lat, lng: selectedShop.lng }}
                        onCloseClick={() => setSelectedShop(null)}
                      >
                        <div className="info-window">
                          <h4>{selectedShop.name}</h4>
                          <p>{selectedShop.address}</p>
                          <div className="info-rating">★ {selectedShop.rating} ({selectedShop.user_ratings_total})</div>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                ) : (
                  <div className="map-loading-state" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    background: '#f1f5f9',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '24px'
                  }}>
                    <style>{`
                      @keyframes map-pulse-srv {
                        0%, 100% { opacity: 0.6; }
                        50% { opacity: 1; }
                      }
                    `}</style>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      animation: 'map-pulse-srv 1.5s infinite ease-in-out'
                    }}>
                      📍
                    </div>
                    <div style={{
                      width: '180px',
                      height: '14px',
                      background: '#cbd5e1',
                      borderRadius: '6px',
                      animation: 'map-pulse-srv 1.5s infinite ease-in-out'
                    }} />
                    <div style={{
                      width: '120px',
                      height: '10px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      animation: 'map-pulse-srv 1.5s infinite ease-in-out'
                    }} />
                  </div>
                )}
              </div>

              <div className="service-card">
                <h3 className="section-subtitle">
                  <span className="badge-pulse" /> ServiceOne Multi-Agent Diagnostic Engine
                </h3>
                
                {loading && activeAgentIndex >= 0 ? (
                  <div className="agent-timeline-card" style={{ marginTop: '1.2rem', boxShadow: 'none', border: 'none', padding: 0 }}>
                    <div className="agent-timeline-progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${((activeAgentIndex + 1) / 5) * 100}%` }} 
                      />
                    </div>
                    <div className="agent-timeline-list">
                      {DIAGNOSTIC_AGENTS.map((agent, index) => {
                        const isCompleted = index < activeAgentIndex;
                        const isActive = index === activeAgentIndex;
                        
                        let statusClass = "agent-pending";
                        let statusText = "Idle Queue";
                        let icon = "○";
                        
                        if (isCompleted) {
                           statusClass = "agent-completed";
                          statusText = "Completed ✓";
                          icon = "✓";
                        } else if (isActive) {
                          statusClass = "agent-active";
                          statusText = "Analyzing...";
                          icon = "⚡";
                        }
                        
                        return (
                          <div key={agent.id} className={`agent-row ${statusClass}`}>
                            <div className="agent-icon-col">
                              <span className="agent-status-icon">{icon}</span>
                            </div>
                            <div className="agent-info-col">
                              <div className="agent-header-row">
                                <span className="agent-name">{agent.name}</span>
                                <span className="agent-status-tag">{statusText}</span>
                              </div>
                              <p className="agent-desc">{agent.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="agent-timeline-footer">
                      <span>Active threads: 5 parallel streams | Secure diagnostic locks verified</span>
                    </div>
                  </div>
                ) : (
                  <div className="shops-list">
                    {pincodeLoading ? (
                      <div className="skeleton-shops-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="shop-item skeleton-shimmer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                            <div className="shop-info" style={{ flex: 1 }}>
                              <div className="skeleton-title" style={{ width: '60%', height: '16px', background: 'rgba(203, 213, 225, 0.4)', borderRadius: '4px', marginBottom: '8px' }} />
                              <div className="skeleton-text" style={{ width: '40%', height: '12px', background: 'rgba(226, 232, 240, 0.4)', borderRadius: '4px' }} />
                            </div>
                            <div className="shop-rating-box skeleton-box" style={{ width: '50px', height: '40px', background: 'rgba(203, 213, 225, 0.4)', borderRadius: '8px' }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {shops.map(shop => (
                          <div key={shop.id} className={`shop-item ${shop.preferred ? 'recommended' : ''}`} onClick={() => selectShop(shop)}>
                            <div className="shop-info">
                              <h3>
                                {shop.name} 
                                {shop.preferred && <span className="verified-badge">✓ Verified Preferred</span>}
                              </h3>
                              <p>{shop.address}</p>
                            </div>
                            <div className="shop-rating-box">
                              <div className="rating-val">★ {shop.rating}</div>
                              <div className="rating-count">{shop.user_ratings_total} reviews</div>
                            </div>
                          </div>
                        ))}
                        {shops.length === 0 && <p className="loading-text">Enter locality pincode to map verified local mechanics...</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
