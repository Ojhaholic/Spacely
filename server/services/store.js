import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')

/**
 * Tiny JSON-file store. Every write is serialised through a per-file promise
 * chain and written via a temp file + rename, so two concurrent requests can
 * never interleave and leave a half-written file on disk.
 */
const queues = new Map()

function enqueue(file, task) {
  const prev = queues.get(file) || Promise.resolve()
  const next = prev.then(task, task)
  // Keep the chain alive even if a task rejects.
  queues.set(
    file,
    next.catch(() => {}),
  )
  return next
}

const fileOf = (name) => path.join(DATA_DIR, `${name}.json`)

export async function readJson(name, fallback = []) {
  try {
    return JSON.parse(await fs.readFile(fileOf(name), 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return fallback
    throw err
  }
}

export function writeJson(name, value) {
  return enqueue(name, async () => {
    const target = fileOf(name)
    const tmp = `${target}.${randomUUID()}.tmp`
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(tmp, JSON.stringify(value, null, 2))
    await fs.rename(tmp, target)
    return value
  })
}

/** Read-modify-write under the same lock, so updates never lose a concurrent change. */
export function mutate(name, fn, fallback = []) {
  return enqueue(name, async () => {
    const current = await readJson(name, fallback)
    const { next, result } = await fn(structuredClone(current))
    if (next !== undefined) {
      const target = fileOf(name)
      const tmp = `${target}.${randomUUID()}.tmp`
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(tmp, JSON.stringify(next, null, 2))
      await fs.rename(tmp, target)
    }
    return result
  })
}

export async function ensureSeeded(name, seed) {
  try {
    await fs.access(fileOf(name))
  } catch {
    await writeJson(name, seed)
  }
}

export { DATA_DIR }
