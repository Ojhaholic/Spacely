// Single place that knows how to reach the backend. Vite proxies /api in dev,
// and VITE_API_URL can point at another origin if the API is hosted elsewhere.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const apiUrl = (path) => `${BASE}${path}`

/** Friendly copy for every error code the server can return. */
export const ERROR_TEXT = {
  UNAUTHORIZED_FACULTY: 'Unauthorized faculty ID.',
  ROOM_OCCUPIED_BY_OTHER_FACULTY:
    'This classroom is currently active with another faculty session.',
  CLASSROOM_NOT_FOUND: 'Classroom no longer exists.',
  ROOM_ALREADY_EXISTS: 'A classroom with that number already exists.',
  FACULTY_ALREADY_EXISTS: 'That faculty ID is already registered.',
  ROOM_OCCUPIED: 'This classroom is currently occupied. Check it out before deleting.',
  NOT_FOUND: 'That record no longer exists.',
  INVALID: 'Please check the values entered.',
  INVALID_REQUEST: 'Please check the values entered.',
  NO_FIELDS: 'Nothing to update.',
  SERVER_ERROR: 'Something went wrong on the server.',
  OFFLINE: 'Unable to connect to Spacely.',
}

export function messageFor(code, fallback) {
  return ERROR_TEXT[code] || fallback || ERROR_TEXT.SERVER_ERROR
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(apiUrl(path), {
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      ...options,
    })
  } catch (err) {
    console.error('[api] network error:', path, err)
    const e = new Error(ERROR_TEXT.OFFLINE)
    e.code = 'OFFLINE'
    throw e
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }

  if (!res.ok || data?.success === false) {
    const code = data?.error || 'SERVER_ERROR'
    console.error('[api]', res.status, path, data)
    const e = new Error(messageFor(code))
    e.code = code
    e.details = data?.errors
    throw e
  }
  return data
}

export const api = {
  classrooms: () => request('/api/classrooms'),
  createClassroom: (body) => request('/api/classrooms', { method: 'POST', body: JSON.stringify(body) }),
  updateClassroom: (id, body) =>
    request(`/api/classrooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClassroom: (id) => request(`/api/classrooms/${id}`, { method: 'DELETE' }),

  faculty: () => request('/api/faculty'),
  createFaculty: (body) => request('/api/faculty', { method: 'POST', body: JSON.stringify(body) }),
  updateFaculty: (id, body) =>
    request(`/api/faculty/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFaculty: (id) => request(`/api/faculty/${id}`, { method: 'DELETE' }),

  scan: (roomId, facultyId) =>
    request('/api/scan', { method: 'POST', body: JSON.stringify({ roomId, facultyId }) }),
}
