import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { useScanStore } from '@/stores/useScanStore'
import { useFilterStore } from '@/stores/useFilterStore'
import { fetchProduct, ProductNotFoundError } from '@/lib/openfoodfacts'
import { getCachedProduct, cacheProduct, addHistoryEntry } from '@/lib/db'
import { evaluateConditions } from '@/lib/conditions'

type CameraState = 'idle' | 'starting' | 'scanning' | 'error'

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const lastScanRef = useRef<number>(0)
  const navigate = useNavigate()
  const { setLoading, setFound, setNotFound, setError, reset } = useScanStore()
  const { activeConditions } = useFilterStore()
  const [manualEan, setManualEan] = useState('')
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [cameraErrorMsg, setCameraErrorMsg] = useState('')

  async function startCamera() {
    setCameraState('starting')
    reset()

    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      await reader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current!,
        (result, err) => {
          if (err && !(err instanceof NotFoundException)) return
          if (!result) return

          const now = Date.now()
          if (now - lastScanRef.current < 1500) return
          lastScanRef.current = now

          handleEan(result.getText())
        }
      )
      setCameraState('scanning')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setCameraErrorMsg(`Camera error: ${msg}`)
      setCameraState('error')
    }
  }

  function stopCamera() {
    readerRef.current?.reset()
    readerRef.current = null
    setCameraState('idle')
  }

  async function handleEan(ean: string) {
    if (!/^\d{8}$|^\d{13}$/.test(ean)) return
    stopCamera()
    setLoading()

    try {
      let product = await getCachedProduct(ean)
      if (!product) {
        product = await fetchProduct(ean)
        await cacheProduct(product)
      }

      const results = evaluateConditions(activeConditions, product)
      setFound(product, results)

      await addHistoryEntry({
        ean,
        product_name: product.name,
        image_url: product.image_url,
        scanned_at: new Date().toISOString(),
        condition_results: results,
      })

      navigate(`/product/${ean}`)
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        setNotFound()
        navigate(`/product/${ean}`)
      } else {
        setError('Could not fetch product. Check your connection.')
        setCameraState('idle')
      }
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleEan(manualEan.trim())
    setManualEan('')
  }

  return (
    <div className="flex flex-col items-center flex-1 bg-gray-950">

      {/* Camera viewport — video always in DOM so ZXing can attach to it */}
      <div className="relative w-full max-w-sm aspect-square overflow-hidden bg-gray-900">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: cameraState === 'scanning' ? 'block' : 'none' }}
        />

        {/* Idle state */}
        {cameraState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">📷</div>
            <button
              onClick={startCamera}
              className="rounded-xl bg-green-600 text-white px-6 py-3 text-base font-semibold"
            >
              Start Scanning
            </button>
          </div>
        )}

        {/* Starting / requesting permission */}
        {cameraState === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Requesting camera…</p>
          </div>
        )}

        {/* Error state */}
        {cameraState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="text-3xl">⚠️</div>
            <p className="text-white text-sm">{cameraErrorMsg}</p>
            <button onClick={() => setCameraState('idle')} className="text-green-400 text-sm underline">
              Try again
            </button>
          </div>
        )}

        {/* Scanning overlay */}
        {cameraState === 'scanning' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-green-400 rounded-lg opacity-80" />
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg"
            >
              Stop
            </button>
          </>
        )}
      </div>

      {/* Manual entry */}
      <div className="w-full max-w-sm px-4 mt-6">
        <p className="text-gray-400 text-sm text-center mb-4">
          Or enter the EAN code manually
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="EAN code (8 or 13 digits)"
            value={manualEan}
            onChange={e => setManualEan(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 text-white px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium"
          >
            Search
          </button>
        </form>
      </div>

    </div>
  )
}
