import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './interfaz/ControladorErrores'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="el simulador">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
