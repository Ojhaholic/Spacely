import { useEffect, useRef, useState } from 'react'
import { api, apiUrl } from '../api/client'

/**
 * Live classroom state. Loads once over REST, then keeps itself current from
 * the server's SSE stream — no polling and no manual refresh anywhere.
 */
export function useClassrooms() {
  const [rooms, setRooms] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [connected, setConnected] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)
  const sourceRef = useRef(null)

  useEffect(() => {
    let alive = true

    api
      .classrooms()
      .then((data) => {
        if (!alive) return
        setRooms(data)
        setStatus('ready')
        setUpdatedAt(Date.now())
      })
      .catch(() => alive && setStatus('error'))

    const es = new EventSource(apiUrl('/api/events'))
    sourceRef.current = es

    es.onopen = () => alive && setConnected(true)
    es.onerror = () => alive && setConnected(false)
    es.onmessage = (event) => {
      if (!alive) return
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      setUpdatedAt(Date.now())
      if (msg.type === 'SNAPSHOT') {
        setRooms(msg.rooms)
        setStatus('ready')
      } else if (msg.type === 'ROOM_STATUS_CHANGED' || msg.type === 'CLASSROOM_UPDATED') {
        setRooms((prev) => prev.map((r) => (r.id === msg.room.id ? msg.room : r)))
      } else if (msg.type === 'CLASSROOM_CREATED') {
        setRooms((prev) => (prev.some((r) => r.id === msg.room.id) ? prev : [...prev, msg.room]))
      } else if (msg.type === 'CLASSROOM_DELETED') {
        setRooms((prev) => prev.filter((r) => r.id !== msg.id))
      }
    }

    return () => {
      alive = false
      es.close()
      sourceRef.current = null
    }
  }, [])

  return { rooms, status, connected, updatedAt }
}

/** "12 sec ago" / "4 min ago" — used for each room's last change. */
export function relativeTime(iso, now = Date.now()) {
  const diff = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (diff < 60) return `${diff} sec ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} d ago`
}
