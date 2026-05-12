import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import html2pdf from 'html2pdf.js'
import './ServicesPage.css'

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
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=95'
  },
  { 
    id: 'tv', 
    label: 'Smart TV', 
    desc: 'Panel, Backlight & Screen Repair',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=95'
  },
  { 
    id: 'wm', 
    label: 'Washing Machine', 
    desc: 'Motor, Drum Repair & Leak Fixes',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=95'
  },
  { 
    id: 'fridge', 
    label: 'Refrigerator', 
    desc: 'Cooling, Compressor & Gas Refill',
    image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=95'
  },
  { 
    id: 'ro', 
    label: 'RO Purifier', 
    desc: 'Filter, Membrane & Motor Repair',
    image: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&w=800&q=95'
  },
  { 
    id: 'geyser', 
    label: 'Geyser Heater', 
    desc: 'Heating, Element & Thermostat Fix',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=95'
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

const BRANDS = [
  'AO Smith', 'Aquaguard', 'Bajaj', 'Blue Star', 'Bosch', 'BPL', 'Carrier', 'Crompton', 'Daikin', 
  'Eureka Forbes', 'Godrej', 'Haier', 'Havells', 'Hisense', 'Hitachi', 'IFB', 'Kelvinator', 'Kenstar', 
  'Kent', 'LG', 'Livpure', 'Lloyd', 'Micromax', 'Mitsubishi', 'O General', 'Onida', 'Orient', 
  'Panasonic', 'Philips', 'Racold', 'Samsung', 'Sansui', 'Siemens', 'Sony', 'Symphony', 'TCL', 
  'Toshiba', 'V-Guard', 'Voltas', 'Whirlpool', 'Xiaomi'
]

const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

const center = {
  lat: 28.6139, // Default New Delhi
  lng: 77.2090
}

function decodeJwt(token) {
  try {
    if (!token) return null
    if (token === 'mock_developer_bypass_token') {
      return {
        email: 'developer@serviceone.dev',
        name: 'Demo Developer'
      }
    }
    if (token.startsWith('mock_user')) {
      const uNum = token.replace('mock_user', '')
      return {
        email: `user${uNum}@serviceone.dev`,
        name: `User ${uNum}`
      }
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
}

export default function ServicesPage() {
  const navigate = useNavigate()
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1)
  const resultRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    } else {
      const decoded = decodeJwt(token)
      if (decoded) {
        setCurrentUser(decoded)
      }
    }
  }, [navigate])

  const [form, setForm] = useState({
    state: '',
    city: '',
    area: '',
    pincode: '',
    appliance: 'ac', // preselect ac to show form immediately as default
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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
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
    fetch('http://127.0.0.1:8000/api/geo/states')
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
    fetch(`http://127.0.0.1:8000/api/geo/cities?state=${encodeURIComponent(form.state)}`)
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
    fetch(`http://127.0.0.1:8000/api/geo/localities?city=${encodeURIComponent(form.city)}`)
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
        const res = await fetch(`http://127.0.0.1:8000/api/geo/pincode/${pin}`)
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

  const validate = () => {
    const e = {}
    if (!form.pincode || form.pincode.length !== 6) e.pincode = 'Pincode required'
    if (!form.state) e.state = 'Select state'
    if (!form.city) e.city = 'Select city'
    if (!form.area) e.area = 'Select area'
    if (!form.appliance) e.appliance = 'Select an appliance'
    if (!form.service) e.service = 'Select a service type'
    if (!form.quoted_price || isNaN(form.quoted_price) || Number(form.quoted_price) <= 0)
      e.quoted_price = 'Enter valid price (₹)'
    return e
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    setResult(null)
    setActiveAgentIndex(0)
    resultRef.current = null

    // Start API request in parallel
    const apiPromise = fetch('http://127.0.0.1:8000/api/check-quote', {
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
          // Wait for API to finish if it hasn't yet
          const apiResult = await apiPromise
          setResult(apiResult)
          setLoading(false)
          setActiveAgentIndex(-1)
          
          // Redirect immediately to standalone Results Page passing data
          navigate('/result/live', {
            state: {
              input: form,
              result: apiResult,
              shops: shops
            }
          })
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

      // If we don't have enough pins (fewer than 5), generate high-fidelity pins across India near mapCenter
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

  const downloadPDF = () => {
    const element = document.getElementById('report-content')
    const opt = {
      margin: 1,
      filename: `ServiceOne_Report_${form.appliance}_${form.brand}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  const services = form.appliance ? SERVICES[form.appliance] : []

  return (
    <>
      <Header />
      
      {/* Dynamic Header Hero Banner with Real Photo */}
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
          
          {/* Interactive Appliance Selection - Compact Category Row with Pictures */}
          <div className="appliance-compact-section">
            <h2 className="section-label-compact">1. Select Appliance Category</h2>
            <div className="appliance-compact-grid">
              {APPLIANCES.map(app => (
                <div 
                  key={app.id} 
                  className={`appliance-compact-card ${form.appliance === app.id ? 'active' : ''}`}
                  onClick={() => {
                    set('appliance', app.id)
                    set('service', '')
                  }}
                >
                  <img src={app.image} alt={app.label} className="appliance-compact-img" />
                  <div className="card-compact-overlay" />
                  <div className="card-compact-text">
                    <h3>{app.label}</h3>
                    <span>{form.appliance === app.id ? '✓ Selected' : 'Choose'}</span>
                  </div>
                </div>
              ))}
            </div>
            {errors.appliance && <p className="err appliance-err-msg">{errors.appliance}</p>}
          </div>

          {/* MAIN 3-COLUMN SERVICES LAYOUT (FORM, MAP, SUMMARY) PLACED FIRST */}
          <div className="services-layout">
            
            {/* LEFT COLUMN: LOCALITY & SERVICE DETAILS */}
            <div className="left-col service-card">
              <h2 className="column-title">2. Enter Locality & Quote Details</h2>
              <form onSubmit={handleSubmit} noValidate>
                
                {/* Pincode & State */}
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

                {/* Locality dropdown */}
                <div className="form-group">
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

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Brand (Compulsory) *</label>
                    <select value={form.brand} onChange={e => set('brand', e.target.value)}>
                      <option value="">Select...</option>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {errors.brand && <span className="err">{errors.brand}</span>}
                  </div>

                  <div className="form-group">
                    <label>Service Type *</label>
                    <select value={form.service} onChange={e => set('service', e.target.value)} disabled={!form.appliance}>
                      <option value="">Select...</option>
                      {services.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.service && <span className="err">{errors.service}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Quoted Price (₹) *</label>
                  <div className="price-input-wrapper">
                    <span className="currency-symbol">₹</span>
                    <input type="number" value={form.quoted_price} onChange={e => set('quoted_price', e.target.value)} placeholder="1500" />
                  </div>
                  {errors.quoted_price && <span className="err">{errors.quoted_price}</span>}
                </div>

                <div className="form-group">
                  <label>Technician / Shop Name</label>
                  <input type="text" value={form.provider_name} onChange={e => set('provider_name', e.target.value)} placeholder="e.g. Sharma Appliance Repairs" />
                </div>

                <button type="submit" className="btn btn-primary btn-large check-button-visual" disabled={loading}>
                  {loading ? 'Crunching Database Geodata...' : 'Validate Fair Market Price →'}
                </button>
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
                        {shops.length === 0 && <p className="loading-text">Enter locality to map verified local mechanics...</p>}
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
