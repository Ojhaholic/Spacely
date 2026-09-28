import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useClassrooms } from '../hooks/useClassrooms'
import StatusDot from '../components/StatusDot'
import Modal from '../components/Modal'

const EMPTY_ROOM = { room: '', building: '', floor: '', capacity: '' }
const EMPTY_FACULTY = { name: '', facultyId: '' }

export default function Admin() {
  const { rooms, status, connected } = useClassrooms()
  const [tab, setTab] = useState('classrooms')
  const [faculty, setFaculty] = useState([])
  const [banner, setBanner] = useState(null)

  const [roomForm, setRoomForm] = useState(null) // {mode,values,id}
  const [facultyForm, setFacultyForm] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const loadFaculty = () => api.faculty().then(setFaculty).catch(() => setFaculty([]))
  useEffect(() => {
    loadFaculty()
  }, [])

  const flash = (kind, text) => {
    setBanner({ kind, text })
    setTimeout(() => setBanner(null), 4000)
  }

  const availableCount = rooms.filter((r) => r.status === 'available').length

  // ── Classroom actions ────────────────────────
  const submitRoom = async (values) => {
    const payload = {
      room: values.room,
      building: values.building,
      floor: Number(values.floor),
      capacity: Number(values.capacity),
    }
    if (roomForm.mode === 'create') {
      await api.createClassroom(payload)
      flash('ok', `${payload.room} created.`)
    } else {
      await api.updateClassroom(roomForm.id, payload)
      flash('ok', `${payload.room} updated.`)
    }
    setRoomForm(null)
  }

  const deleteRoom = async (room) => {
    try {
      await api.deleteClassroom(room.id)
      flash('ok', `${room.room} deleted.`)
      setConfirm(null)
    } catch (err) {
      setConfirm(null)
      flash('error', err.message)
    }
  }

  // ── Faculty actions ──────────────────────────
  const submitFaculty = async (values) => {
    if (facultyForm.mode === 'create') {
      await api.createFaculty(values)
      flash('ok', `${values.name} added.`)
    } else {
      await api.updateFaculty(facultyForm.id, values)
      flash('ok', `${values.name} updated.`)
    }
    await loadFaculty()
    setFacultyForm(null)
  }

  const deleteFaculty = async (member) => {
    try {
      await api.deleteFaculty(member.id)
      await loadFaculty()
      flash('ok', `${member.name} removed.`)
      setConfirm(null)
    } catch (err) {
      setConfirm(null)
      flash('error', err.message)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper/85">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3.5">
            <a href="/" className="font-mono text-[15px] font-medium text-ink hover:text-lime">
              SPACELY
            </a>
            <span className="label text-ink-faint">Admin</span>
          </div>
          <span className={`label ${connected ? 'text-lime' : 'text-ink-faint'}`}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-10">
        {/* Always rendered, so showing a message never changes the sibling
            count here — that would remount the tabs below and reset them. */}
        <div aria-live="polite" className={banner ? 'mb-6' : ''}>
          {banner && (
            <p
              className={`rounded border px-4 py-3 text-[13px] ${
                banner.kind === 'ok'
                  ? 'border-lime/35 bg-lime-wash text-lime'
                  : 'border-rust/30 bg-rust/[0.05] text-rust'
              }`}
            >
              {banner.text}
            </p>
          )}
        </div>

        <section className="flex items-stretch gap-10 border-y border-line-soft py-4">
          <Stat label="Total Rooms" value={rooms.length} />
          <div className="w-px bg-line-soft" />
          <Stat label="Available" value={availableCount} tone="lime" />
          <div className="w-px bg-line-soft" />
          <Stat label="Occupied" value={rooms.length - availableCount} />
        </section>

        <nav className="mt-8 flex gap-1 border-b border-line">
          {['classrooms', 'faculty'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`label -mb-px border-b-2 px-4 py-3 transition-colors ${
                tab === t
                  ? 'border-lime text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink-dim'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === 'classrooms' ? (
          <section className="py-6">
            <div className="flex items-center justify-between">
              <h2 className="label text-ink-faint">Classrooms</h2>
              <button
                type="button"
                onClick={() => setRoomForm({ mode: 'create', values: EMPTY_ROOM })}
                className="label rounded border border-lime bg-lime px-3.5 py-2.5 text-white transition-colors hover:bg-lime/90"
              >
                + Add Classroom
              </button>
            </div>

            {status === 'loading' ? (
              <p className="mt-6 label text-ink-faint">Loading…</p>
            ) : (
              <Table
                head={['Room', 'Building', 'Floor', 'Capacity', 'Status', '']}
                rows={[...rooms]
                  .sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true }))
                  .map((r) => ({
                    key: r.id,
                    cells: [
                      <span key="room" className="font-mono text-ink">{r.room}</span>,
                      r.building,
                      r.floor,
                      r.capacity,
                      <span key="status" className="inline-flex items-center gap-2">
                        <StatusDot status={r.status} />
                        <span className={r.status === 'available' ? 'text-lime' : 'text-rust'}>
                          {r.status}
                        </span>
                      </span>,
                      <Actions
                        key="actions"
                        onEdit={() =>
                          setRoomForm({
                            mode: 'edit',
                            id: r.id,
                            values: {
                              room: r.room,
                              building: r.building,
                              floor: String(r.floor),
                              capacity: String(r.capacity),
                            },
                          })
                        }
                        onDelete={() =>
                          setConfirm({
                            title: `Delete ${r.room}?`,
                            body:
                              r.status === 'occupied'
                                ? 'This classroom is currently occupied. Check it out before deleting.'
                                : 'This removes the classroom for everyone. This cannot be undone.',
                            blocked: r.status === 'occupied',
                            onConfirm: () => deleteRoom(r),
                          })
                        }
                      />,
                    ],
                  }))}
              />
            )}
          </section>
        ) : (
          <section className="py-6">
            <div className="flex items-center justify-between">
              <h2 className="label text-ink-faint">Faculty</h2>
              <button
                type="button"
                onClick={() => setFacultyForm({ mode: 'create', values: EMPTY_FACULTY })}
                className="label rounded border border-lime bg-lime px-3.5 py-2.5 text-white transition-colors hover:bg-lime/90"
              >
                + Add Faculty
              </button>
            </div>

            <Table
              head={['Name', 'Faculty ID', '']}
              rows={faculty.map((f) => ({
                key: f.id,
                cells: [
                  f.name,
                  <span key="fid" className="font-mono text-ink">{f.facultyId}</span>,
                  <Actions
                    key="actions"
                    onEdit={() =>
                      setFacultyForm({
                        mode: 'edit',
                        id: f.id,
                        values: { name: f.name, facultyId: f.facultyId },
                      })
                    }
                    onDelete={() =>
                      setConfirm({
                        title: `Remove ${f.name}?`,
                        body: 'This faculty ID will no longer be able to check in or out.',
                        onConfirm: () => deleteFaculty(f),
                      })
                    }
                  />,
                ],
              }))}
            />
          </section>
        )}
      </main>

      {roomForm && (
        <RecordForm
          title={roomForm.mode === 'create' ? 'Add Classroom' : 'Edit Classroom'}
          initial={roomForm.values}
          fields={[
            { name: 'room', label: 'Room number', placeholder: 'SCSE-505' },
            { name: 'building', label: 'Building', placeholder: 'C Block' },
            { name: 'floor', label: 'Floor', placeholder: '5', type: 'number' },
            { name: 'capacity', label: 'Capacity', placeholder: '60', type: 'number' },
          ]}
          note={
            roomForm.mode === 'edit'
              ? 'Occupancy is controlled by the classroom terminal and cannot be edited here.'
              : null
          }
          onSubmit={submitRoom}
          onClose={() => setRoomForm(null)}
        />
      )}

      {facultyForm && (
        <RecordForm
          title={facultyForm.mode === 'create' ? 'Add Faculty' : 'Edit Faculty'}
          initial={facultyForm.values}
          fields={[
            { name: 'name', label: 'Name', placeholder: 'Demo Faculty' },
            { name: 'facultyId', label: 'Faculty ID', placeholder: '24SCSE1010531' },
          ]}
          note="Letters and digits only. Spaces and dashes are removed automatically, and this must match the QR code exactly."
          onSubmit={submitFaculty}
          onClose={() => setFacultyForm(null)}
        />
      )}

      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="text-[13px] leading-relaxed text-ink-dim">{confirm.body}</p>
          <div className="mt-6 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              className="label rounded border border-line bg-paper-raised px-3.5 py-2.5 text-ink-dim transition-colors hover:text-ink"
            >
              Cancel
            </button>
            {!confirm.blocked && (
              <button
                type="button"
                onClick={confirm.onConfirm}
                className="label rounded border border-rust bg-rust px-3.5 py-2.5 text-white transition-colors hover:opacity-90"
              >
                Delete
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function RecordForm({ title, initial, fields, note, onSubmit, onClose }) {
  const [values, setValues] = useState(initial)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    // Guard the native submit too: a form with no action GETs the current URL,
    // which reloads the page and throws away all admin state.
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err.details?.length ? err.details.join(', ') : err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className="label block text-ink-faint">
                {f.label}
              </label>
              <input
                id={f.name}
                type={f.type || 'text'}
                value={values[f.name]}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && submit(e)}
                className="mt-2 w-full rounded border border-line bg-paper-raised px-3.5 py-2.5
                           text-[14px] text-ink transition-colors placeholder:text-ink-faint
                           hover:border-line-strong focus:border-lime/60 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {note && <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">{note}</p>}
        {error && (
          <p
            role="alert"
            className="mt-4 flex gap-2 rounded border-2 border-rust bg-rust/[0.08] px-3.5 py-3 text-[13px] font-medium text-rust"
          >
            <span aria-hidden="true">✕</span>
            <span>
              <strong className="block">Not saved</strong>
              {error}
            </span>
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="label rounded border border-line bg-paper-raised px-3.5 py-2.5 text-ink-dim transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="label rounded border border-lime bg-lime px-3.5 py-2.5 text-white transition-colors hover:bg-lime/90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Table({ head, rows }) {
  if (rows.length === 0)
    return (
      <p className="mt-6 rounded-md border border-dashed border-line-strong py-12 text-center label text-ink-faint">
        Nothing here yet.
      </p>
    )

  return (
    <div className="mt-5 overflow-x-auto rounded-md border border-line">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line bg-paper-sunk">
            {head.map((h, i) => (
              <th key={i} className="label px-4 py-3 text-left font-normal text-ink-faint">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line-soft bg-paper-raised last:border-0">
              {r.cells.map((c, i) => (
                <td key={i} className="px-4 py-3 text-ink-dim">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Actions({ onEdit, onDelete }) {
  return (
    <span className="flex justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="label rounded px-2.5 py-1.5 text-ink-faint transition-colors hover:bg-paper-sunk hover:text-ink"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="label rounded px-2.5 py-1.5 text-ink-faint transition-colors hover:bg-rust/10 hover:text-rust"
      >
        Delete
      </button>
    </span>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div>
      <p className="label text-ink-faint">{label}</p>
      <p
        className={`mt-1.5 font-mono text-[22px] leading-none ${
          tone === 'lime' ? 'text-lime' : 'text-ink-dim'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
