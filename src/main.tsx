import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('[Main] Bootstrap starting...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('[Main] CRITICAL: Root element #root not found!')
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    console.log('[Main] Bootstrap complete')
  } catch (err) {
    console.error('[Main] CRITICAL: Render threw an error:', err)
  }
}
