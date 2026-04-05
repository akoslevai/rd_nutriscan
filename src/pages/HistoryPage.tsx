import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, clearHistory } from '@/lib/db'
import type { ScanHistoryEntry, ConditionStatus } from '@/types'

const STATUS_ICON: Record<ConditionStatus, string> = {
  safe: '✅', unsafe: '❌', uncertain: '⚠️',
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    getHistory().then(setHistory)
  }, [])

  async function handleClear() {
    await clearHistory()
    setHistory([])
  }

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
        <div className="text-4xl">📋</div>
        <p className="text-sm text-gray-500">No scans yet. Start scanning products!</p>
        <button onClick={() => navigate('/')} className="mt-2 rounded-lg bg-green-600 text-white px-5 py-2 text-sm">
          Scan now
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Scan History</h1>
        <button onClick={handleClear} className="text-xs text-red-500">Clear all</button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {history.map((entry, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            {entry.image_url
              ? <img src={entry.image_url} alt="" className="w-12 h-12 object-contain rounded-lg bg-gray-50 shrink-0" />
              : <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{entry.product_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(entry.scanned_at).toLocaleString()}
              </p>
              {entry.condition_results.length > 0 && (
                <p className="text-xs mt-1">
                  {entry.condition_results.map(r => STATUS_ICON[r.status]).join(' ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
