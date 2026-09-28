import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const API_TARGET = process.env.API_TARGET || 'http://localhost:5000'
const ROUTES = ['/terminal', '/admin']

// Serve index.html for the client routes so they survive a direct load/refresh.
const spaFallback = {
  name: 'spa-fallback',
  configureServer: attach,
  configurePreviewServer: attach,
}

function attach(server) {
  server.middlewares.use((req, _res, next) => {
    const path = (req.url || '').split('?')[0]
    if (ROUTES.includes(path)) req.url = '/index.html'
    next()
  })
}

// host: true binds to 0.0.0.0 so phones on the same Wi-Fi can reach the app.
// The /api proxy means the phone never needs to know the backend's address.
// allowedHosts lets a Cloudflare quick tunnel serve the app over HTTPS, which
// is what the phone camera needs — getUserMedia only runs in a secure context.
const server = {
  host: true,
  allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.loca.lt'],
  proxy: {
    '/api': { target: API_TARGET, changeOrigin: true },
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback],
  server,
  preview: server,
})
