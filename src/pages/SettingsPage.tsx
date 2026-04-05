import { CONDITIONS } from '@/lib/conditions'
import { useFilterStore } from '@/stores/useFilterStore'

export default function SettingsPage() {
  const { activeConditions, toggleCondition } = useFilterStore()

  return (
    <div className="flex-1 p-4">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Dietary Conditions</h1>
      <p className="text-sm text-gray-500 mb-4">Select the conditions to check on every scan.</p>

      <div className="flex flex-col gap-2">
        {CONDITIONS.map(c => {
          const active = activeConditions.includes(c.id)
          return (
            <button
              key={c.id}
              onClick={() => toggleCondition(c.id)}
              className={`flex items-center justify-between rounded-xl px-4 py-3 border text-left transition-colors ${
                active
                  ? 'bg-green-50 border-green-500 dark:bg-green-950'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
              }`}
            >
              <span className={`text-sm font-medium ${active ? 'text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {c.label}
              </span>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                active ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}>
                {active && <span className="text-white text-xs">✓</span>}
              </span>
            </button>
          )
        })}
      </div>

      {activeConditions.length === 0 && (
        <p className="mt-4 text-xs text-gray-400 text-center">No conditions selected — all products will show as unchecked.</p>
      )}
    </div>
  )
}
