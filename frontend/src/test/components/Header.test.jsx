import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from '../../components/layout-next/Header'

// Mock next/navigation
const mockRouter = {
  prefetch: () => null,
  push: vi.fn(),
}
vi.mock('next/navigation', () => ({
  useRouter() {
    return mockRouter
  },
  usePathname() {
    return '/'
  },
}))

describe('Header', () => {
  it('renders the ServiceOne logo', () => {
    render(<Header />)
    expect(screen.getByText('ServiceOne')).toBeInTheDocument()
  })

  it('renders Log in button', () => {
    render(<Header />)
    expect(screen.getByText('Log in')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Header />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })
})

