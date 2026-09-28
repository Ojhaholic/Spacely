import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { mutate, readJson } from '../services/store.js'
import { broadcast } from '../services/realtime.js'

const router = Router()

/** Validates the client-supplied fields. Status is never accepted from the frontend. */
function validate(body, { partial = false } = {}) {
  const errors = []
  const out = {}

  const has = (k) => body[k] !== undefined && body[k] !== null && body[k] !== ''

  if (has('room')) {
    const room = String(body.room).trim().toUpperCase()
    if (!/^[A-Z0-9-]{2,12}$/.test(room)) errors.push('room must be 2-12 letters, digits or dashes')
    else out.room = room
  } else if (!partial) errors.push('room is required')

  if (has('building')) {
    const building = String(body.building).trim()
    if (building.length < 1 || building.length > 40) errors.push('building must be 1-40 characters')
    else out.building = building
  } else if (!partial) errors.push('building is required')

  if (has('floor')) {
    const floor = Number(body.floor)
    if (!Number.isInteger(floor) || floor < 0 || floor > 20) errors.push('floor must be 0-20')
    else out.floor = floor
  } else if (!partial) errors.push('floor is required')

  if (has('capacity')) {
    const capacity = Number(body.capacity)
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000)
      errors.push('capacity must be 1-1000')
    else out.capacity = capacity
  } else if (!partial) errors.push('capacity is required')

  return { errors, out }
}

router.get('/', async (_req, res, next) => {
  try {
    res.json(await readJson('classrooms'))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { errors, out } = validate(req.body || {})
    if (errors.length) return res.status(400).json({ success: false, error: 'INVALID', errors })

    const created = await mutate('classrooms', (rooms) => {
      if (rooms.some((r) => r.room === out.room)) return { result: { conflict: true } }
      const room = {
        id: `${out.room.toLowerCase()}-${randomUUID().slice(0, 8)}`,
        ...out,
        status: 'available',
        activeSession: null,
        updatedAt: new Date().toISOString(),
      }
      return { next: [...rooms, room], result: { room } }
    })

    if (created.conflict)
      return res.status(409).json({ success: false, error: 'ROOM_ALREADY_EXISTS' })

    broadcast('CLASSROOM_CREATED', { room: created.room })
    res.status(201).json({ success: true, room: created.room })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { errors, out } = validate(req.body || {}, { partial: true })
    if (errors.length) return res.status(400).json({ success: false, error: 'INVALID', errors })
    if (Object.keys(out).length === 0)
      return res.status(400).json({ success: false, error: 'NO_FIELDS' })

    const result = await mutate('classrooms', (rooms) => {
      const i = rooms.findIndex((r) => r.id === req.params.id)
      if (i === -1) return { result: { missing: true } }
      if (out.room && rooms.some((r) => r.room === out.room && r.id !== req.params.id))
        return { result: { conflict: true } }
      // Occupancy is owned by the terminal — status/activeSession are not editable here.
      const room = { ...rooms[i], ...out, updatedAt: new Date().toISOString() }
      const next = [...rooms]
      next[i] = room
      return { next, result: { room } }
    })

    if (result.missing) return res.status(404).json({ success: false, error: 'NOT_FOUND' })
    if (result.conflict) return res.status(409).json({ success: false, error: 'ROOM_ALREADY_EXISTS' })

    broadcast('CLASSROOM_UPDATED', { room: result.room })
    res.json({ success: true, room: result.room })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await mutate('classrooms', (rooms) => {
      const room = rooms.find((r) => r.id === req.params.id)
      if (!room) return { result: { missing: true } }
      // Refuse to silently drop a room that someone is currently checked into.
      if (room.status === 'occupied' || room.activeSession) return { result: { occupied: true } }
      return { next: rooms.filter((r) => r.id !== req.params.id), result: { room } }
    })

    if (result.missing) return res.status(404).json({ success: false, error: 'NOT_FOUND' })
    if (result.occupied) return res.status(409).json({ success: false, error: 'ROOM_OCCUPIED' })

    broadcast('CLASSROOM_DELETED', { id: req.params.id })
    res.json({ success: true, id: req.params.id })
  } catch (err) {
    next(err)
  }
})

export default router
