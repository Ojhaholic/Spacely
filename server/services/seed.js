// Initial demo data. Written to server/data/*.json on first boot only —
// after that the JSON files are the source of truth and survive restarts.

const now = () => new Date().toISOString()

const ROOMS = [
  ['A-101', 'A Block', 1, 60, 'available'],
  ['A-102', 'A Block', 1, 60, 'occupied'],
  ['A-103', 'A Block', 1, 45, 'available'],
  ['A-201', 'A Block', 2, 120, 'available'],
  ['A-202', 'A Block', 2, 60, 'available'],
  ['A-203', 'A Block', 2, 60, 'occupied'],
  ['A-301', 'A Block', 3, 45, 'available'],
  ['A-302', 'A Block', 3, 90, 'occupied'],
  ['B-101', 'B Block', 1, 60, 'available'],
  ['B-102', 'B Block', 1, 45, 'available'],
  ['B-103', 'B Block', 1, 45, 'occupied'],
  ['B-201', 'B Block', 2, 120, 'available'],
  ['B-202', 'B Block', 2, 45, 'available'],
  ['B-301', 'B Block', 3, 60, 'occupied'],
  ['B-302', 'B Block', 3, 60, 'available'],
  ['C-101', 'C Block', 1, 180, 'available'],
  ['C-102', 'C Block', 1, 180, 'occupied'],
  ['C-201', 'C Block', 2, 120, 'available'],
  ['C-202', 'C Block', 2, 120, 'available'],
  ['C-204', 'C Block', 2, 60, 'available'],
  ['C-301', 'C Block', 3, 90, 'available'],
  ['AI-101', 'AI Block', 1, 45, 'available'],
  ['AI-102', 'AI Block', 1, 45, 'occupied'],
  ['AI-201', 'AI Block', 2, 60, 'available'],
  ['AI-202', 'AI Block', 2, 90, 'available'],
  ['AI-301', 'AI Block', 3, 60, 'occupied'],
]

export const seedClassrooms = () =>
  ROOMS.map(([room, building, floor, capacity, status]) => ({
    id: room.toLowerCase(),
    room,
    building,
    floor,
    capacity,
    status,
    activeSession: null,
    updatedAt: now(),
  }))

export const seedFaculty = () => [
  { id: 'fac-demo-1', name: 'Demo Faculty', facultyId: '24SCSE1010531', createdAt: now() },
]

export const seedSessions = () => []
