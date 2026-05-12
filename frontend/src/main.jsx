import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Disable all browser console logs globally in production to prevent any security leakage or error exposure
if (import.meta.env.PROD) {
  const noop = () => {};
  window.console.log = noop;
  window.console.error = noop;
  window.console.warn = noop;
  window.console.info = noop;
  window.console.debug = noop;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
