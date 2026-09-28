/** Small QR affordance in the header — opens the classroom terminal in a new tab. */
export default function TerminalLink() {
  return (
    <a
      href="/terminal"
      target="_blank"
      rel="noopener noreferrer"
      title="Open the classroom terminal in a new tab"
      className="group flex items-center gap-2 rounded border border-line bg-paper-raised px-2.5 py-1.5
                 text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 fill-current">
        <path d="M1 1h5v5H1V1zm1.2 1.2v2.6h2.6V2.2H2.2zM10 1h5v5h-5V1zm1.2 1.2v2.6h2.6V2.2h-2.6zM1 10h5v5H1v-5zm1.2 1.2v2.6h2.6v-2.6H2.2z" />
        <path d="M10 10h2v2h-2v-2zM13 10h2v2h-2v-2zM10 13h2v2h-2v-2zM13 13h2v2h-2v-2z" />
      </svg>
      <span className="label hidden sm:inline">Classroom Terminal</span>
    </a>
  )
}
