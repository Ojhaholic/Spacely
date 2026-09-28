import { useEffect, useId, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

/**
 * Mounts the webcam QR reader. Calls onResult with the decoded text once,
 * then stops itself — the parent unmounts this component on success.
 */
export default function QrScanner({ onResult, onError }) {
  const regionId = useId().replace(/:/g, '')
  const scannerRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const host = document.getElementById(regionId)
    const scanner = new Html5Qrcode(regionId, { verbose: false })
    scannerRef.current = scanner

    // Hold the startup promise so cleanup can wait for it. Tearing down while
    // start() is still in flight would otherwise leave the camera track live.
    const started = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (doneRef.current) return
          doneRef.current = true
          onResult(decoded)
        },
        () => {
          // Per-frame "no QR found" — normal while aiming, so ignore it.
        },
      )
      .catch((err) => {
        if (cancelled) return
        const name = err?.name || ''
        onError(
          name === 'NotAllowedError' || /permission|denied/i.test(String(err))
            ? 'Camera access is required to scan the faculty ID.'
            : 'Could not start the camera. Check that no other app is using it.',
        )
      })

    // Always release the camera when leaving the scan state or the page.
    return () => {
      cancelled = true
      const s = scannerRef.current
      scannerRef.current = null
      if (!s) return
      // Wait for start() to settle before stopping — tearing down mid-startup
      // leaves the camera track live, and touching the <video> while play()
      // is still pending throws a noisy AbortError.
      started
        .catch(() => {})
        .then(() => (s.isScanning ? s.stop() : null))
        .catch(() => {})
        .then(() => {
          try {
            s.clear()
          } catch {
            /* already cleared */
          }
          // Backstop for any track stop() did not release.
          host?.querySelectorAll('video').forEach((v) => {
            const tracks = v.srcObject?.getTracks?.() || []
            if (tracks.length === 0) return
            tracks.forEach((t) => t.stop())
            v.srcObject = null
          })
        })
    }
  }, [regionId, onResult, onError])

  return (
    <div className="relative overflow-hidden rounded-md border border-line bg-paper-sunk">
      <div id={regionId} className="[&_video]:block [&_video]:w-full [&_video]:object-cover" />
      {/* Corner brackets — a scan target, drawn over the video feed. */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute top-4 left-4 size-6 border-t-2 border-l-2 border-lime-bright" />
        <span className="absolute top-4 right-4 size-6 border-t-2 border-r-2 border-lime-bright" />
        <span className="absolute bottom-4 left-4 size-6 border-b-2 border-l-2 border-lime-bright" />
        <span className="absolute right-4 bottom-4 size-6 border-r-2 border-b-2 border-lime-bright" />
      </div>
    </div>
  )
}
