import { useEffect, useMemo, useState } from 'react'
import { useClassrooms, relativeTime } from '../hooks/useClassrooms'
import ClassroomCard from '../components/ClassroomCard'
import ClassroomDrawer from '../components/ClassroomDrawer'
import FilterBar from '../components/FilterBar'
import TerminalLink from '../components/TerminalLink'

export default function Home() {
  const { rooms, status, connected, updatedAt } = useClassrooms()
  const [query, setQuery] = useState('')
  const [block, setBlock] = useState('all')
  const [floor, setFloor] = useState('all')
  const [capacity, setCapacity] = useState('all')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [selected, setSelected] = useState(null)

  // Drives the "x sec ago" labels without re-fetching anything.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])

  const blocks = useMemo(
    () => [...new Set(rooms.map((r) => r.building))].sort(),
    [rooms],
  )
  const floors = useMemo(
    () => [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b),
    [rooms],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rooms
      .filter((r) => !q || r.room.toLowerCase().includes(q) || r.building.toLowerCase().includes(q))
      .filter((r) => block === 'all' || r.building === block)
      .filter((r) => floor === 'all' || r.floor === Number(floor))
      .filter((r) => capacity === 'all' || r.capacity >= Number(capacity))
      .filter((r) => !availableOnly || r.status === 'available')
      .sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true }))
  }, [rooms, query, block, floor, capacity, availableOnly])

  const availableCount = rooms.filter((r) => r.status === 'available').length
  const occupiedCount = rooms.length - availableCount
  const isFiltered =
    query !== '' || block !== 'all' || floor !== 'all' || capacity !== 'all' || availableOnly

  const reset = () => {
    setQuery('')
    setBlock('all')
    setFloor('all')
    setCapacity('all')
    setAvailableOnly(false)
  }

  const selectedRoom = rooms.find((r) => r.id === selected) || null

  return (
    <div className="grid-bg min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-baseline gap-3.5">
            <span className="font-mono text-[15px] font-medium tracking-[0.02em] text-ink">
              SPACELY
            </span>
            <span className="label hidden text-ink-faint sm:inline">
              Campus Space / Galgotias University
            </span>
          </div>

          <div className="flex items-center gap-4">
            <TerminalLink />
            <LivePill connected={connected} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* ── Hero ─────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-line-soft pt-11 pb-9">
          <h1 className="text-[30px] leading-tight font-medium tracking-[-0.02em] text-ink md:text-[34px]">
            Find an empty classroom.
          </h1>
          <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-ink-dim">
            See what&rsquo;s available across campus before you start walking.
          </p>
          <p className="mt-6 flex items-center gap-2.5">
            <span className="relative flex size-[5px]">
              {connected && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-bright opacity-60" />
              )}
              <span
                className={`relative inline-flex size-[5px] rounded-full ${
                  connected ? 'bg-lime-bright' : 'bg-ink-faint'
                }`}
              />
            </span>
            <span className="label text-ink-dim">
              {connected ? 'Campus status live' : 'Reconnecting'}
            </span>
            <span className="label text-ink-faint">
              · Updated {updatedAt ? relativeTime(updatedAt, now) : '—'}
            </span>
          </p>

          {/* Restrained wayfinding marks — decorative only. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 hidden h-full w-[280px] lg:block"
          >
            <svg viewBox="0 0 280 200" className="h-full w-full">
              <g className="stroke-line-strong" strokeWidth="1" fill="none">
                <path d="M40 0v200M140 0v200M240 0v200" strokeDasharray="2 8" opacity="0.7" />
                <path d="M0 60h280M0 140h280" strokeDasharray="2 8" opacity="0.7" />
              </g>
              <g className="fill-ink-faint" fontSize="7" fontFamily="monospace" opacity="0.55">
                <text x="46" y="54">A·01</text>
                <text x="146" y="54">B·02</text>
                <text x="146" y="134">C·03</text>
              </g>
              <circle cx="140" cy="60" r="3" className="fill-lime-bright" opacity="0.8" />
              <circle cx="40" cy="140" r="2" className="fill-ink-faint" opacity="0.5" />
              <circle cx="240" cy="140" r="2" className="fill-ink-faint" opacity="0.5" />
            </svg>
          </div>
        </section>

        {/* ── Filters ──────────────────────────── */}
        <section className="flex flex-wrap items-center justify-between gap-4 py-6">
          <FilterBar
            query={query}
            onQuery={setQuery}
            block={block}
            onBlock={setBlock}
            floor={floor}
            onFloor={setFloor}
            capacity={capacity}
            onCapacity={setCapacity}
            availableOnly={availableOnly}
            onAvailableOnly={setAvailableOnly}
            blocks={blocks}
            floors={floors}
            onReset={reset}
            isFiltered={isFiltered}
          />
          <p className="label text-ink-dim">
            <span className="text-lime">{visible.length}</span> Showing
          </p>
        </section>

        {/* ── Summary ──────────────────────────── */}
        <section className="flex items-stretch gap-10 border-y border-line-soft py-4">
          <Stat label="Available Now" value={availableCount} tone="lime" loading={status === 'loading'} />
          <div className="w-px bg-line-soft" />
          <Stat label="Occupied" value={occupiedCount} loading={status === 'loading'} />
          <div className="w-px bg-line-soft" />
          <Stat label="Total Rooms" value={rooms.length} loading={status === 'loading'} />
        </section>

        {/* ── Grid ─────────────────────────────── */}
        <section className="py-8">
          {status === 'loading' && <SkeletonGrid />}

          {status === 'error' && (
            <div className="rounded-md border border-rust/30 bg-rust/[0.05] py-14 text-center">
              <p className="label text-rust">Unable to connect to Spacely</p>
              <p className="mt-3 text-[13px] text-ink-dim">
                Start the API with <span className="font-mono">npm run dev</span> and this page will
                reconnect on its own.
              </p>
            </div>
          )}

          {status === 'ready' && visible.length === 0 && (
            <div className="rounded-md border border-dashed border-line-strong py-16 text-center">
              <p className="label text-ink-faint">No classrooms match your filters.</p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={reset}
                  className="label mt-4 text-ink-dim underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {status === 'ready' && visible.length > 0 && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((room) => (
                <ClassroomCard
                  key={room.id}
                  data={room}
                  now={now}
                  selected={selected === room.id}
                  onSelect={(id) => setSelected((prev) => (prev === id ? null : id))}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-8">
          <span className="font-mono text-[12px] tracking-[0.02em] text-ink-dim">SPACELY</span>
          <span className="label text-ink-faint">Prototype // Galgotias University</span>
          <span className="label text-ink-faint">DESIGNOVA 2026</span>
        </footer>
      </main>

      <ClassroomDrawer room={selectedRoom} now={now} onClose={() => setSelected(null)} />
    </div>
  )
}

function LivePill({ connected }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors ${
        connected ? 'border-lime/25 bg-lime-wash' : 'border-line bg-paper-sunk'
      }`}
    >
      <span className="relative flex size-[5px]">
        {connected && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-bright opacity-60" />
        )}
        <span
          className={`relative inline-flex size-[5px] rounded-full ${
            connected ? 'bg-lime-bright' : 'bg-ink-faint'
          }`}
        />
      </span>
      <span className={`label ${connected ? 'text-lime' : 'text-ink-faint'}`}>
        {connected ? 'Live' : 'Offline'}
      </span>
    </span>
  )
}

function Stat({ label, value, tone, loading }) {
  return (
    <div>
      <p className="label text-ink-faint">{label}</p>
      {loading ? (
        <span className="mt-2 block h-[22px] w-9 animate-pulse rounded bg-line" />
      ) : (
        <p
          className={`mt-1.5 font-mono text-[22px] leading-none ${
            tone === 'lime' ? 'text-lime' : 'text-ink-dim'
          }`}
        >
          {value}
        </p>
      )}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-md border border-line bg-paper-raised p-5">
          <span className="block h-2 w-20 animate-pulse rounded bg-line" />
          <span className="mt-6 block h-4 w-24 animate-pulse rounded bg-line" />
          <span className="mt-3 block h-2.5 w-20 animate-pulse rounded bg-line-soft" />
          <span className="mt-6 block h-2.5 w-full animate-pulse rounded bg-line-soft" />
        </div>
      ))}
    </div>
  )
}
