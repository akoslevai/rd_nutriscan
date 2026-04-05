import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { useScanStore } from '@/stores/useScanStore'
import { useFilterStore } from '@/stores/useFilterStore'
import { fetchProduct, ProductNotFoundError } from '@/lib/openfoodfacts'
import { getCachedProduct, cacheProduct, addHistoryEntry } from '@/lib/db'
import { evaluateConditions } from '@/lib/conditions'

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const lastScanRef = useRef<number>(0)
  const navigate = useNavigate()
  const { setLoading, setFound, setNotFound, setError, reset } = useScanStore()
  const { activeConditions } = useFilterStore()
  const [manualEan, setManualEan] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    reset()
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
      if (!result) return
      if (err && !(err instanceof NotFoundException)) return

      const now = Date.now()
      if (now - lastScanRef.current < 1500) return
      lastScanRef.current = now

      handleEan(result.getText())
    }).catch(() => {
      setCameraError('Camera unavailable. Please use manual entry.')
    })

    return () => { reader.reset() }
  }, [])

  async function handleEan(ean: string) {
    if (!/^\d{8}$|^\d{13}$/.test(ean)) return
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
      <div className="relative w-full max-w-sm aspect-square overflow-hidden">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-sm p-4 text-center">
            {cameraError}
          </div>
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" />
        )}
        {/* scan line overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 border-2 border-green-400 rounded-lg opacity-70" />
        </div>
      </div>

      <div className="w-full max-w-sm px-4 mt-6">
        <p className="text-gray-400 text-sm text-center mb-4">
          Point camera at a barcode, or enter it manually
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{8}|\d{13}"
            placeholder="EAN code (8 or 13 digits)"
            value={manualEan}
            onChange={e => setManualEan(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 text-white px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-500"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  )
}
