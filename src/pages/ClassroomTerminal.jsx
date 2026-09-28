import { useCallback, useMemo, useState } from 'react'
import { api, messageFor } from '../api/client'
import { useClassrooms } from '../hooks/useClassrooms'
import QrScanner from '../components/QrScanner'
import StatusDot from '../components/StatusDot'

const ORDINAL = { 0: 'Ground', 1: '1st', 2: '2nd', 3: '3rd' }
const floorLabel = (n) => ORDINAL[n] || `${n}th`

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

export default function ClassroomTerminal() {
  const { rooms, status, connected } = useClassrooms()
  const [roomId, setRoomId] = useState('')
  const [mode, setMode] = useState('idle') // idle | scanning | busy | result
  const [result, setResult] = useState(null)

  const sorted = useMemo(
    () => [...rooms].sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true })),
    [rooms],
  )
  const room = rooms.find((r) => r.id === roomId) || null

  const handleResult = useCallback(
    async (decoded) => {
      const facultyId = String(decoded || '').trim()
      if (!facultyId) {
        setMode('result')
        setResult({ kind: 'invalid' })
        return
      }

      // The backend is authoritative — it decides check-in vs check-out.
      setMode('busy')
      try {
        const res = await api.scan(roomId, facultyId)
        setResult({
          kind: 'ok',
          action: res.action,
          facultyName: res.faculty.name,
          facultyId: res.faculty.facultyId,
          room: res.room.room,
          next: res.room.status,
          at: formatTime(res.at),
        })
      } catch (err) {
        setResult({ kind: 'error', code: err.code, message: err.message, scanned: facultyId })
      }
      setMode('result')
    },
    [roomId],
  )

  const handleError = useCallback((message) => {
    setMode('result')
    setResult({ kind: 'error', code: 'CAMERA', message })
  }, [])

  const reset = () => {
    setResult(null)
    setMode('idle')
  }

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper/85">
        <div className="mx-auto flex max-w-[640px] items-baseline justify-between px-6 py-4">
          <div className="flex items-baseline gap-3.5">
            <span className="font-mono text-[15px] font-medium tracking-[0.02em] text-ink">
              SPACELY
            </span>
            <span className="label text-ink-faint">Classroom Terminal</span>
          </div>
          <span className={`label ${connected ? 'text-lime' : 'text-ink-faint'}`}>
            {connected ? 'Online' : 'Offline'}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-10">
        {status === 'error' ? (
          <div className="rounded-md border border-rust/30 bg-rust/[0.05] p-6">
            <p className="label text-rust">Unable to connect to Spacely</p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
              The terminal needs the API. Start it with{' '}
              <span className="font-mono">npm run dev</span>.
            </p>
          </div>
        ) : (
          <>
            <label htmlFor="room" className="label block text-ink-faint">
              Select Classroom
            </label>
            <div className="relative mt-2.5">
              <select
                id="room"
                value={roomId}
                disabled={mode === 'scanning' || mode === 'busy' || status === 'loading'}
                onChange={(e) => {
                  setRoomId(e.target.value)
                  reset()
                }}
                className="w-full cursor-pointer appearance-none rounded border border-line bg-paper-raised
                           py-3 pr-10 pl-4 font-mono text-[14px] text-ink transition-colors
                           hover:border-line-strong focus:border-lime/60 focus:outline-none
                           disabled:cursor-not-allowed disabled:opacity-55"
              >
                <option value="">
                  {status === 'loading' ? 'Loading classrooms…' : 'Select classroom'}
                </option>
                {sorted.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room} — {r.building}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 10 6"
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-4 w-[10px] -translate-y-1/2 fill-none stroke-ink-faint stroke-[1.4]"
              >
                <path d="M1 1L5 5L9 1" strokeLinecap="square" />
              </svg>
            </div>

            {room && (
              <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
                <div className="bg-paper-raised p-5">
                  <p className="label text-ink-faint">Selected Room</p>
                  <p className="mt-2 font-mono text-[22px] leading-none text-ink">{room.room}</p>
                  <p className="mt-2 text-[13px] text-ink-dim">
                    {floorLabel(room.floor)} Floor · {room.building}
                  </p>
                </div>
                <div className="bg-paper-raised p-5">
                  <p className="label text-ink-faint">Current Status</p>
                  <p className="mt-2 flex items-center gap-2">
                    <StatusDot status={room.status} />
                    <span
                      className={`label text-[11px] ${
                        room.status === 'available' ? 'text-lime' : 'text-rust'
                      }`}
                    >
                      {room.status}
                    </span>
                  </p>
                  <p className="mt-2 text-[13px] text-ink-dim">{room.capacity} seats</p>
                </div>
              </div>
            )}

            {mode === 'idle' && (
              <button
                type="button"
                disabled={!room}
                onClick={() => {
                  setResult(null)
                  setMode('scanning')
                }}
                className="mt-6 w-full rounded border border-lime bg-lime py-4 label text-[11px] text-white
                           transition-colors hover:bg-lime/90 disabled:cursor-not-allowed
                           disabled:border-line disabled:bg-paper-sunk disabled:text-ink-faint"
              >
                {room ? 'Scan Faculty ID' : 'Select a classroom first'}
              </button>
            )}

            {mode === 'scanning' && (
              <div className="mt-6">
                <QrScanner onResult={handleResult} onError={handleError} />
                <p className="mt-4 text-center text-[13px] text-ink-dim">
                  Point the faculty ID QR code at the camera.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 w-full rounded border border-line bg-paper-raised py-3 label text-ink-dim
                             transition-colors hover:border-line-strong hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            )}

            {mode === 'busy' && (
              <p className="mt-6 rounded-md border border-line bg-paper-raised py-6 text-center label text-ink-dim">
                Verifying faculty ID…
              </p>
            )}

            {mode === 'result' && result && (
              <div className="mt-6">
                <ResultPanel result={result} />
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 w-full rounded border border-line bg-paper-raised py-3 label text-ink-dim
                             transition-colors hover:border-line-strong hover:text-ink"
                >
                  Scan Again
                </button>
              </div>
            )}
          </>
        )}

        <p className="mt-8 border-t border-line-soft pt-5 text-[12px] leading-relaxed text-ink-faint">
          Prototype terminal. Faculty IDs are verified against the Spacely server — this simulates
          an ID-card tap and is not real authentication.
        </p>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-6 py-6">
          <span className="font-mono text-[12px] text-ink-dim">SPACELY</span>
          <span className="label text-ink-faint">DESIGNOVA 2026</span>
        </div>
      </footer>
    </div>
  )
}

function ResultPanel({ result }) {
  if (result.kind === 'ok') {
    const checkedIn = result.action === 'check-in'
    return (
      <div className="animate-[fadeIn_180ms_ease-out] rounded-md border border-lime/35 bg-lime-wash p-6">
        <p className="label text-lime">
          ✓ {checkedIn ? 'Faculty Verified' : 'Checkout Successful'}
        </p>
        <dl className="mt-5 space-y-3">
          <Row label="Faculty" value={result.facultyName} />
          {checkedIn && <Row label="Faculty ID" value={result.facultyId} />}
          <Row label="Room" value={result.room} />
          <Row
            label="Status"
            value={
              <span className="inline-flex items-center gap-2">
                <StatusDot status={result.next} />
                <span className={checkedIn ? 'text-rust' : 'text-lime'}>
                  {result.next.toUpperCase()}
                </span>
              </span>
            }
          />
          <Row label={checkedIn ? 'Checked in' : 'Checked out'} value={result.at} />
        </dl>
      </div>
    )
  }

  const title =
    result.kind === 'invalid'
      ? 'Invalid QR code'
      : result.code === 'UNAUTHORIZED_FACULTY'
        ? 'Unauthorized ID'
        : result.code === 'CAMERA'
          ? 'Camera unavailable'
          : result.code === 'ROOM_OCCUPIED_BY_OTHER_FACULTY'
            ? 'Session belongs to another faculty'
            : 'Scan failed'

  const body =
    result.kind === 'invalid'
      ? 'That code could not be read. Try again.'
      : result.code === 'UNAUTHORIZED_FACULTY'
        ? 'Only registered faculty IDs can access classroom terminals.'
        : result.message || messageFor(result.code)

  return (
    <div className="animate-[fadeIn_180ms_ease-out] rounded-md border border-rust/30 bg-rust/[0.05] p-6">
      <p className="label text-rust">✕ {title}</p>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">{body}</p>
      {result.scanned && (
        <p className="mt-4 border-t border-rust/15 pt-4 font-mono text-[12px] text-ink-faint">
          Scanned: {result.scanned}
        </p>
      )}
      <p className="mt-3 label text-ink-faint">Room status unchanged</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="label text-ink-faint">{label}</dt>
      <dd className="text-right font-mono text-[13px] text-ink">{value}</dd>
    </div>
  )
}
