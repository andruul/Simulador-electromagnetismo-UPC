import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vitest/config'

// Content Security Policy for the production (offline) bundle loaded from file://.
// - No remote origins at all: scripts, styles, images, fonts and connections are local.
// - 'unsafe-inline' is allowed for styles only: React/Three.js set element styles at runtime.
// - blob:/data: images are needed for canvas evidence export and WebGL textures.
// It is injected at build time only, because the Vite dev server needs inline scripts and
// WebSocket HMR, which this strict policy would (rightly) block.
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    injectCsp()
  ],
  base: './',
  server: {
    port: 5173,
    strictPort: true
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
