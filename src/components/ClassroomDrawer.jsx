import { useEffect } from 'react'
import StatusDot from './StatusDot'
import { relativeTime } from '../hooks/useClassrooms'

const ORDINAL = { 0: 'Ground', 1: '1st', 2: '2nd', 3: '3rd' }
const floorLabel = (n) => ORDINAL[n] || `${n}th`

/** Inline detail for a selected room. No route change — an overlay panel. */
export default function ClassroomDrawer({ room, onClose, now }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!room) return null
  const isFree = room.status === 'available'

  return (
    <div className="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-ink/15 backdrop-blur-[1px]"
      />
      <aside className="relative flex h-full w-full max-w-[360px] flex-col border-l border-line bg-paper-raised">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <span className="label text-ink-faint">Classroom</span>
          <button
            type="button"
            onClick={onClose}
            className="label rounded px-2 py-1 text-ink-faint transition-colors hover:text-ink"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <p className="flex items-center gap-2">
            <StatusDot status={room.status} />
            <span className={`label ${isFree ? 'text-lime' : 'text-rust'}`}>{room.status}</span>
          </p>

          <h2 className="mt-4 font-mono text-[30px] leading-none tracking-tight text-ink">
            {room.room}
          </h2>
          <p className="mt-2.5 text-[14px] text-ink-dim">
            {floorLabel(room.floor)} Floor · {room.building}
          </p>

          <dl className="mt-7 space-y-px overflow-hidden rounded-md border border-line bg-line">
            <Row label="Block" value={room.building} />
            <Row label="Floor" value={`${floorLabel(room.floor)} Floor`} />
            <Row label="Capacity" value={`${room.capacity} seats`} />
            <Row label="Last updated" value={relativeTime(room.updatedAt, now)} />
          </dl>

          <p className="mt-6 rounded-md border border-line-soft bg-paper-sunk px-4 py-3.5 text-[13px] leading-relaxed text-ink-dim">
            {isFree
              ? 'This room is free right now. Status changes the moment a faculty member checks in at the classroom terminal.'
              : 'A faculty session is active in this room. It becomes available when they check out.'}
          </p>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 bg-paper-raised px-4 py-3">
      <dt className="label text-ink-faint">{label}</dt>
      <dd className="text-right font-mono text-[13px] text-ink">{value}</dd>
    </div>
  )
}
