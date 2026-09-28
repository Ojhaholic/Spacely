import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { mutate, readJson } from '../services/store.js'
import { broadcast } from '../services/realtime.js'
import { normalizeFacultyId } from '../services/facultyId.js'

const router = Router()

function validate(body, { partial = false } = {}) {
  const errors = []
  const out = {}
  const has = (k) => body[k] !== undefined && body[k] !== null && body[k] !== ''

  if (has('name')) {
    const name = String(body.name).trim()
    if (name.length < 2 || name.length > 60) errors.push('name must be 2-60 characters')
    else out.name = name
  } else if (!partial) errors.push('name is required')

  if (has('facultyId')) {
    const facultyId = normalizeFacultyId(body.facultyId)
    if (!/^[A-Z0-9]{4,32}$/.test(facultyId))
      errors.push('Faculty ID must be 4-32 letters or digits (spaces and dashes are ignored)')
    else out.facultyId = facultyId
  } else if (!partial) errors.push('facultyId is required')

  return { errors, out }
}

router.get('/', async (_req, res, next) => {
  try {
    res.json(await readJson('faculty'))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { errors, out } = validate(req.body || {})
    if (errors.length) return res.status(400).json({ success: false, error: 'INVALID', errors })

    const result = await mutate('faculty', (list) => {
      if (list.some((f) => f.facultyId === out.facultyId)) return { result: { conflict: true } }
      const member = { id: `fac-${randomUUID().slice(0, 8)}`, ...out, createdAt: new Date().toISOString() }
      return { next: [...list, member], result: { member } }
    })

    if (result.conflict)
      return res.status(409).json({ success: false, error: 'FACULTY_ALREADY_EXISTS' })

    broadcast('FACULTY_CHANGED', {})
    res.status(201).json({ success: true, member: result.member })
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

    const result = await mutate('faculty', (list) => {
      const i = list.findIndex((f) => f.id === req.params.id)
      if (i === -1) return { result: { missing: true } }
      if (out.facultyId && list.some((f) => f.facultyId === out.facultyId && f.id !== req.params.id))
        return { result: { conflict: true } }
      const member = { ...list[i], ...out }
      const next = [...list]
      next[i] = member
      return { next, result: { member } }
    })

    if (result.missing) return res.status(404).json({ success: false, error: 'NOT_FOUND' })
    if (result.conflict)
      return res.status(409).json({ success: false, error: 'FACULTY_ALREADY_EXISTS' })

    broadcast('FACULTY_CHANGED', {})
    res.json({ success: true, member: result.member })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await mutate('faculty', (list) => {
      const member = list.find((f) => f.id === req.params.id)
      if (!member) return { result: { missing: true } }
      return { next: list.filter((f) => f.id !== req.params.id), result: { member } }
    })

    if (result.missing) return res.status(404).json({ success: false, error: 'NOT_FOUND' })

    broadcast('FACULTY_CHANGED', {})
    res.json({ success: true, id: req.params.id })
  } catch (err) {
    next(err)
  }
})

export default router
