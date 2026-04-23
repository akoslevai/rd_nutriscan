import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useScanStore } from '@/stores/useScanStore'
import type { ConditionStatus } from '@/types'

const STATUS_CONFIG: Record<ConditionStatus, { icon: string; color: string; label: string }> = {
  safe:      { icon: '✅', color: 'text-green-600', label: 'Safe' },
  unsafe:    { icon: '❌', color: 'text-red-600',   label: 'Not Safe' },
  uncertain: { icon: '⚠️', color: 'text-yellow-600', label: 'Uncertain' },
}

const NUTRISCORE_COLOR: Record<string, string> = {
  a: 'bg-green-600', b: 'bg-lime-500', c: 'bg-yellow-400',
  d: 'bg-orange-500', e: 'bg-red-600',
}

export default function ProductDetailPage() {
  const { ean } = useParams<{ ean: string }>()
  const navigate = useNavigate()
  const { status, product, conditionResults, rawData } = useScanStore()
  const [showRaw, setShowRaw] = useState(false)
  const [fetchedRaw, setFetchedRaw] = useState<unknown>(null)
  const [rawLoading, setRawLoading] = useState(false)

  async function handleShowRaw() {
    // Use already-stored raw data if available (fresh scan)
    if (rawData != null) { setShowRaw(true); return }
    // Otherwise fetch from OFF on demand
    setRawLoading(true)
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${product!.ean}.json`)
      const data = await res.json()
      setFetchedRaw(data.product ?? data)
    } catch {
      setFetchedRaw({ error: 'Could not fetch raw data' })
    } finally {
      setRawLoading(false)
      setShowRaw(true)
    }
  }

  const displayRaw = rawData ?? fetchedRaw

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Looking up product…</div>
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">🔍</div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Product not found</h2>
        <p className="text-sm text-gray-500">EAN: {ean}</p>
        <p className="text-sm text-gray-500">This product isn't in Open Food Facts yet.</p>
        <button onClick={() => navigate('/')} className="mt-2 rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-medium">
          Scan another
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm text-gray-500">Could not load product. Check your connection.</p>
        <button onClick={() => navigate('/')} className="rounded-lg bg-green-600 text-white px-5 py-2 text-sm">
          Try again
        </button>
      </div>
    )
  }

  if (!product) {
    navigate('/')
    return null
  }

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Product header */}
      <div className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="w-20 h-20 object-contain rounded-lg bg-gray-50" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{product.name}</h1>
          {product.brand && <p className="text-sm text-gray-500 mt-0.5">{product.brand}</p>}
          {product.nutriscore && (
            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-white text-xs font-bold uppercase ${NUTRISCORE_COLOR[product.nutriscore]}`}>
              Nutriscore {product.nutriscore.toUpperCase()}
            </span>
          )}
          {product.source === 'community' && (
            <span className="inline-block mt-2 ml-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
              Community
            </span>
          )}
        </div>
      </div>

      {/* Condition results */}
      {conditionResults.length > 0 ? (
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Conditions</h2>
          <div className="flex flex-col gap-2">
            {conditionResults.map(r => {
              const cfg = STATUS_CONFIG[r.status]
              return (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-900 px-4 py-3">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.label}</span>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-gray-400">
          No active filters. <button onClick={() => navigate('/settings')} className="text-green-600 underline">Set up conditions</button>
        </div>
      )}

      {/* Ingredients */}
      {product.ingredients_text && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Ingredients</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{product.ingredients_text}</p>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex flex-col gap-2">
        <button onClick={() => navigate('/')} className="w-full rounded-xl bg-green-600 text-white py-3 font-medium text-sm">
          Scan another
        </button>
        <button
          onClick={handleShowRaw}
          disabled={rawLoading}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-3 text-sm disabled:opacity-50"
        >
          {rawLoading ? 'Loading…' : 'Show raw Open Food Facts data'}
        </button>
      </div>

      {/* Raw data modal */}
      {showRaw && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h2 className="text-white text-sm font-semibold">Raw Open Food Facts response</h2>
            <button onClick={() => setShowRaw(false)} className="text-gray-400 text-sm px-2 py-1">✕ Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <pre className="text-xs text-green-300 whitespace-pre-wrap break-all leading-relaxed">
              {String(JSON.stringify(displayRaw, null, 2))}
            </pre>
          </div>
        </div>
      )}

    </div>
  )
}
