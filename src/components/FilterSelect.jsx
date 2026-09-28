export default function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="label cursor-pointer appearance-none rounded border border-line bg-paper-raised py-2.5 pr-8 pl-3.5
                   text-ink-dim transition-colors hover:border-line-strong hover:text-ink
                   focus:border-lime/60 focus:text-ink focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-paper-raised text-ink">
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 10 6"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 w-[9px] -translate-y-1/2 fill-none stroke-ink-faint stroke-[1.4]"
      >
        <path d="M1 1L5 5L9 1" strokeLinecap="square" />
      </svg>
    </div>
  )
}
