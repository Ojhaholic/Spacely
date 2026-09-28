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
      className={`group relative flex flex-col items-start rounded-md border p-5 text-left
        transition-[colors,box-shadow,transform] duration-200
        ${
          isFree
            ? 'border-line bg-paper-raised shadow-[0_1px_2px_rgba(23,24,26,0.05)] hover:-translate-y-px hover:border-lime/40 hover:shadow-[0_4px_14px_rgba(23,24,26,0.07)]'
            : 'border-line-soft bg-paper-sunk hover:border-line'
        }
        ${selected ? 'border-lime/60 ring-1 ring-lime/25' : ''}`}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={data.status} />
        <span className={`label ${isFree ? 'text-lime' : 'text-ink-faint'}`}>{data.status}</span>
      </div>

      <div className="mt-5">
        <h3
          className={`font-mono text-[19px] leading-none tracking-tight ${
            isFree ? 'text-ink' : 'text-ink-dim'
          }`}
        >
          {data.room}
        </h3>
        <p className={`mt-2 text-[13px] ${isFree ? 'text-ink-dim' : 'text-ink-faint'}`}>
          {data.building}
        </p>
      </div>

      <div className="mt-5 flex w-full items-baseline justify-between border-t border-line-soft pt-3">
        <span className="text-[12px] text-ink-faint">{floorLabel(data.floor)} Floor</span>
        <span className="font-mono text-[12px] text-ink-faint">{data.capacity} seats</span>
      </div>

      <div className="mt-2.5 flex w-full items-center justify-between">
        <p className="label text-ink-faint">Updated {relativeTime(data.updatedAt, now)}</p>
        <span
          aria-hidden="true"
          className="translate-x-0 text-[13px] text-ink-faint opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
        >
          →
        </span>
      </div>
    </button>
  )
}
