import '@testing-library/jest-dom'

class MockLocalStorage {
  constructor() {
    this.store = {}
  }
  clear() {
    this.store = {}
  }
  getItem(key) {
    return this.store[key] || null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
}

const mockLocal = new MockLocalStorage()
const mockSession = new MockLocalStorage()

Object.defineProperty(window, 'localStorage', {
  value: mockLocal,
  configurable: true,
  writable: true
})

Object.defineProperty(window, 'sessionStorage', {
  value: mockSession,
  configurable: true,
  writable: true
})

global.localStorage = mockLocal
global.sessionStorage = mockSession


