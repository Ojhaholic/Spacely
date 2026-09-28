// Server-Sent Events fan-out. One backend state, many synchronised clients.

const clients = new Set()

export function addClient(res) {
  clients.add(res)
  return () => clients.delete(res)
}

export function broadcast(type, payload) {
  const frame = `data: ${JSON.stringify({ type, ...payload })}\n\n`
  for (const res of clients) {
    try {
      res.write(frame)
    } catch {
      clients.delete(res)
    }
  }
}

export const clientCount = () => clients.size
