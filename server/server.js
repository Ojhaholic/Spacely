import { networkInterfaces } from 'node:os'
import express from 'express'
import classroomsRouter from './routes/classrooms.js'
import facultyRouter from './routes/faculty.js'
import scanRouter from './routes/scan.js'
import { addClient, clientCount } from './services/realtime.js'
import { seedClassrooms, seedFaculty, seedSessions } from './services/seed.js'
import { ensureSeeded, readJson } from './services/store.js'

const PORT = Number(process.env.PORT) || 5000
const app = express()

app.use(express.json({ limit: '64kb' }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Server-Sent Events: push the current state on connect, then deltas.
app.get('/api/events', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Proxies (Cloudflare tunnels, nginx) buffer a stream unless told not to.
    // Without identity encoding the events never reach the browser live.
    'Content-Encoding': 'identity',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()
  // Send each event immediately instead of batching small writes.
  req.socket.setNoDelay(true)
  req.socket.setKeepAlive(true)
  // 2KB of padding forces intermediaries to release the initial buffer.
  res.write(`: ${' '.repeat(2048)}\n\n`)
  res.write('retry: 3000\n\n')

  const remove = addClient(res)
  try {
    res.write(
      `data: ${JSON.stringify({ type: 'SNAPSHOT', rooms: await readJson('classrooms') })}\n\n`,
    )
  } catch (err) {
    console.error('[sse] snapshot failed:', err.message)
  }

  // Comment frames keep proxies from closing an idle stream.
  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n')
    } catch {
      /* closed */
    }
  }, 25000)

  req.on('close', () => {
    clearInterval(ping)
    remove()
    res.end()
  })
})

app.use('/api/classrooms', classroomsRouter)
app.use('/api/faculty', facultyRouter)
app.use('/api/scan', scanRouter)

app.use('/api', (_req, res) => res.status(404).json({ success: false, error: 'NOT_FOUND' }))

// Never leak a stack trace to the client; log the detail for development.
app.use((err, _req, res, _next) => {
  console.error('[api] unhandled error:', err)
  res.status(500).json({ success: false, error: 'SERVER_ERROR' })
})

await ensureSeeded('classrooms', seedClassrooms())
await ensureSeeded('faculty', seedFaculty())
await ensureSeeded('sessions', seedSessions())

/** First non-internal IPv4 address, so the console can print a phone-reachable URL. */
function lanAddress() {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) return a.address
    }
  }
  return null
}

// 0.0.0.0 so devices on the same Wi-Fi can reach the API, not just this machine.
app.listen(PORT, '0.0.0.0', () => {
  const lan = lanAddress()
  console.log(`[spacely] API      http://localhost:${PORT}`)
  if (lan) console.log(`[spacely] API LAN  http://${lan}:${PORT}`)
  console.log(`[spacely] SSE clients: ${clientCount()}`)
})
