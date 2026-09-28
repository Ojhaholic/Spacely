import StatusDot from './StatusDot'
import { relativeTime } from '../hooks/useClassrooms'

const ORDINAL = { 0: 'Ground', 1: '1st', 2: '2nd', 3: '3rd' }
const floorLabel = (n) => ORDINAL[n] || `${n}th`

export default function ClassroomCard({ data, selected, onSelect, now }) {
  const isFree = data.status === 'available'

  return (
    <button
      type="button"
      onClick={() => onSelect(data.id)}
      aria-pressed={selected}
      className={`group relative flex w-full flex-col items-start overflow-hidden rounded-xl border p-4 text-left
        transition-[colors,box-shadow,transform] duration-200 sm:p-5
        ${
          isFree
            ? 'border-line bg-paper-raised shadow-[0_1px_3px_rgba(23,24,26,0.06)] hover:-translate-y-0.5 hover:border-lime/45 hover:shadow-[0_10px_26px_rgba(23,24,26,0.1)]'
            : 'border-line-soft bg-paper-sunk hover:border-line'
        }
        ${selected ? 'border-lime/70 ring-2 ring-lime/20' : ''}`}
    >
      {/* Colour spine — makes availability readable at a glance on a phone. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${isFree ? 'bg-lime-bright' : 'bg-rust/35'}`}
      />

      <div className="flex w-full items-center justify-between gap-2 pl-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 ${
            isFree ? 'bg-lime-wash' : 'bg-rust/[0.08]'
          }`}
        >
          <StatusDot status={data.status} />
          <span className={`label ${isFree ? 'text-lime' : 'text-rust'}`}>{data.status}</span>
        </span>
        <span className="label rounded-md bg-brand-soft px-1.5 py-1 text-brand">
          {floorLabel(data.floor)}
        </span>
      </div>

      <div className="mt-4 pl-1.5">
        <h3
          className={`font-display text-[24px] leading-none font-bold tracking-[-0.02em] sm:text-[26px] ${
            isFree ? 'text-brand' : 'text-ink-dim'
          }`}
        >
          {data.room}
        </h3>
        <p className={`mt-1.5 text-[13px] ${isFree ? 'text-ink-dim' : 'text-ink-faint'}`}>
          {data.building}
        </p>
      </div>

      <div className="mt-4 flex w-full items-center justify-between border-t border-line-soft pt-3 pl-1.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-dim">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 fill-none stroke-ink-faint stroke-[1.5]">
            <circle cx="5.5" cy="5" r="2.2" />
            <path d="M1.8 13c0-2.2 1.7-3.6 3.7-3.6s3.7 1.4 3.7 3.6" strokeLinecap="round" />
            <path d="M10.6 3.2a2.2 2.2 0 010 3.9M12 9.7c1.4.5 2.3 1.7 2.3 3.3" strokeLinecap="round" />
          </svg>
          <span className="font-mono">{data.capacity}</span> seats
        </span>
        <span
          aria-hidden="true"
          className={`text-[15px] transition-[opacity,transform] duration-200 ${
            isFree ? 'text-lime' : 'text-ink-faint'
          } translate-x-0 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100`}
        >
          →
        </span>
      </div>

      <p className="mt-2 pl-1.5 label text-ink-faint">Updated {relativeTime(data.updatedAt, now)}</p>
    </button>
  )
}
