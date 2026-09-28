const TONE = {
  available: 'bg-lime-bright ring-[3px] ring-lime-bright/20',
  occupied: 'bg-rust/60',
}

export default function StatusDot({ status }) {
  return <span className={`size-[5px] shrink-0 rounded-full ${TONE[status]}`} />
}
