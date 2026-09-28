import { useEffect } from 'react'

export default function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/20 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-[420px] animate-[fadeIn_160ms_ease-out] rounded-md border border-line bg-paper-raised shadow-[0_12px_40px_rgba(23,24,26,0.12)]">
        <header className="border-b border-line px-6 py-4">
          <h2 className="label text-ink">{title}</h2>
        </header>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  )
}
