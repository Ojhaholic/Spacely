import Home from './pages/Home'
import ClassroomTerminal from './pages/ClassroomTerminal'
import Admin from './pages/Admin'

const ROUTES = {
  '/terminal': ClassroomTerminal,
  '/admin': Admin,
}

/**
 * Minimal path switch — three screens, so a router dependency would be
 * overkill. The terminal and admin open in their own tabs.
 */
export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const Page = ROUTES[path] || Home
  return <Page />
}
