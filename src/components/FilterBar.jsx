import FilterSelect from './FilterSelect'

export default function FilterBar({
  query,
  onQuery,
  block,
  onBlock,
  floor,
  onFloor,
  capacity,
  onCapacity,
  availableOnly,
  onAvailableOnly,
  blocks,
  floors,
  onReset,
  isFiltered,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative">
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 fill-none stroke-ink-faint stroke-[1.5]"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search classroom..."
          aria-label="Search classrooms"
          className="w-[210px] rounded border border-line bg-paper-raised py-2.5 pr-3 pl-8.5
                     text-[13px] text-ink transition-colors placeholder:text-ink-faint
                     hover:border-line-strong focus:border-lime/60 focus:outline-none"
        />
      </div>

      <FilterSelect
        label="Block"
        value={block}
        onChange={onBlock}
        options={[{ value: 'all', label: 'All Blocks' }, ...blocks.map((b) => ({ value: b, label: b }))]}
      />
      <FilterSelect
        label="Floor"
        value={floor}
        onChange={onFloor}
        options={[
          { value: 'all', label: 'All Floors' },
          ...floors.map((f) => ({ value: String(f), label: `Floor ${f}` })),
        ]}
      />
      <FilterSelect
        label="Capacity"
        value={capacity}
        onChange={onCapacity}
        options={[
          { value: 'all', label: 'Capacity' },
          { value: '45', label: '45+ Seats' },
          { value: '60', label: '60+ Seats' },
          { value: '120', label: '120+ Seats' },
        ]}
      />

      <button
        type="button"
        onClick={() => onAvailableOnly(!availableOnly)}
        aria-pressed={availableOnly}
        className={`label rounded border px-3 py-2.5 transition-colors ${
          availableOnly
            ? 'border-lime/45 bg-lime-wash text-lime'
            : 'border-line bg-paper-raised text-ink-dim hover:border-line-strong hover:text-ink'
        }`}
      >
        Available Only
      </button>

      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="label px-2 text-ink-faint transition-colors hover:text-ink"
        >
          Reset
        </button>
      )}
    </div>
  )
}
