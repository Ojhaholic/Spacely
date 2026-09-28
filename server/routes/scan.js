import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { mutate, readJson, writeJson } from '../services/store.js'
import { broadcast } from '../services/realtime.js'

const router = Router()

/**
 * The only endpoint that may change occupancy. The frontend sends what was
 * scanned; the server decides what it means.
 */
router.post('/', async (req, res, next) => {
  try {
    const roomId = String(req.body?.roomId || '').trim()
    const facultyId = String(req.body?.facultyId || '')
      .trim()
      .toUpperCase()

    if (!roomId || !facultyId)
      return res.status(400).json({ success: false, error: 'INVALID_REQUEST' })

    // Step 2: the scanned code must belong to a known faculty member.
    const faculty = await readJson('faculty')
    const member = faculty.find((f) => f.facultyId === facultyId)
    if (!member) return res.status(401).json({ success: false, error: 'UNAUTHORIZED_FACULTY' })

    // Steps 1 + 3 under the classrooms lock, so two scans cannot race.
    const outcome = await mutate('classrooms', (rooms) => {
      const i = rooms.findIndex((r) => r.id === roomId)
      if (i === -1) return { result: { missing: true } }

      const room = rooms[i]
      const next = [...rooms]
      const at = new Date().toISOString()

      if (room.status === 'available') {
        const session = { id: `ses-${randomUUID().slice(0, 8)}`, roomId, facultyId, checkIn: at }
        next[i] = { ...room, status: 'occupied', activeSession: session, updatedAt: at }
        return { next, result: { action: 'check-in', room: next[i], session } }
      }

      // Occupied — only the faculty who checked in may check out.
      if (room.activeSession && room.activeSession.facultyId !== facultyId)
        return { result: { otherFaculty: true, room } }

      const closed = room.activeSession
        ? { ...room.activeSession, checkOut: at }
        : { id: `ses-${randomUUID().slice(0, 8)}`, roomId, facultyId, checkIn: at, checkOut: at }
      next[i] = { ...room, status: 'available', activeSession: null, updatedAt: at }
      return { next, result: { action: 'check-out', room: next[i], session: closed } }
    })

    if (outcome.missing) return res.status(404).json({ success: false, error: 'CLASSROOM_NOT_FOUND' })
    if (outcome.otherFaculty)
      return res.status(409).json({ success: false, error: 'ROOM_OCCUPIED_BY_OTHER_FACULTY' })

    // Append to the session log (best effort — never fails the scan).
    try {
      const sessions = await readJson('sessions')
      await writeJson('sessions', [...sessions, { ...outcome.session, action: outcome.action }])
    } catch (err) {
      console.error('[scan] could not append session log:', err.message)
    }

    broadcast('ROOM_STATUS_CHANGED', { room: outcome.room })

    res.json({
      success: true,
      action: outcome.action,
      room: outcome.room,
      faculty: { name: member.name, facultyId: member.facultyId },
      at: outcome.room.updatedAt,
    })
  } catch (err) {
    next(err)
  }
})

export default router
