import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vitest/config'

const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'"
].join("; ")

function injectCsp(): Plugin {
  return {
    name: "inject-production-csp",
    apply: "build",
    transformIndexHtml(html) {
      const meta = `<meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />
    ${meta}`)
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    injectCsp()
  ],
  base: './',
  build: {
    chunkSizeWarningLimit: 700
  },
  server: {
    port: 5173,
    strictPort: true
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node'
  }
})
