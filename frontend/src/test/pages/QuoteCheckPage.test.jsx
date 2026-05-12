import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ServicesPage from '../../app/services/page.jsx'

// Mock next/navigation
const mockPush = vi.fn()
const mockRouter = {
  push: mockPush,
  prefetch: () => null,
}

vi.mock('next/navigation', () => ({
  useRouter() {
    return mockRouter
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/services'
  },
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock Google Map component
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }) => <div data-testid="mock-google-map">{children}</div>,
  useJsApiLoader: () => ({ isLoaded: true, loadError: null }),
  Marker: () => <div data-testid="mock-marker" />,
  InfoWindow: ({ children }) => <div data-testid="mock-infowindow">{children}</div>,
}))

// Mock fetch calls
global.fetch = vi.fn((url) => {
  if (url.includes('/api/geo/pincode/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        state: 'KARNATAKA',
        city: 'Bangalore',
        localities: ['Adugodi S.O']
      }),
    })
  }
  if (url.includes('/api/geo/states')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ states: ['KARNATAKA', 'MAHARASHTRA', 'DELHI'] }),
    })
  }
  if (url.includes('/api/geo/cities')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ cities: ['Bangalore', 'Mumbai', 'New Delhi'] }),
    })
  }
  if (url.includes('/api/geo/localities')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ localities: ['Adugodi S.O', 'Andheri East', 'Connaught Place'] }),
    })
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
})

describe('ServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Set mock token to prevent auto-redirect to /login
    localStorage.setItem('token', 'mock_developer_bypass_token')
  })

  it('renders geography inputs', async () => {
    render(<ServicesPage />)
    expect(await screen.findByText('Pincode *')).toBeInTheDocument()
    expect(await screen.findByText('State *')).toBeInTheDocument()
    expect(await screen.findByText('City *')).toBeInTheDocument()
    expect(await screen.findByText('Locality *')).toBeInTheDocument()
  })

  it('handles pincode lookup and transitions to step 2 appliance selection', async () => {
    render(<ServicesPage />)
    
    // Wait for mount and find pincode input
    const pinInput = await screen.findByPlaceholderText('e.g. 110001')
    fireEvent.change(pinInput, { target: { value: '560001' } })

    
    // Wait for the states call and selection updates
    await waitFor(() => {
      expect(screen.getByDisplayValue('KARNATAKA')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bangalore')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Adugodi S.O')).toBeInTheDocument()
    })

    // Click next button
    const nextBtn = screen.getByText('Next: Appliance & Brand →')
    fireEvent.click(nextBtn)

    // Now on step 2, expect category buttons
    expect(screen.getAllByText('Air Conditioner').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Smart TV').length).toBeGreaterThan(0)

    // Select TV and verify click
    const tvButton = screen.getAllByText('Smart TV')[0].closest('button')
    fireEvent.click(tvButton)
    expect(tvButton).toBeInTheDocument()
  })
})


