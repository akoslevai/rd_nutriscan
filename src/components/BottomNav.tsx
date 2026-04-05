import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',         icon: '📷', label: 'Scan'     },
  { to: '/history',  icon: '📋', label: 'History'  },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="flex border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {NAV.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
              isActive ? 'text-green-600' : 'text-gray-400'
            }`
          }
        >
          <span className="text-xl leading-none">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
