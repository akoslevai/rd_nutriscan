import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useScanStore } from '@/stores/useScanStore'
import { useFilterStore } from '@/stores/useFilterStore'
import { submitCustomProduct } from '@/lib/customProducts'
import { cacheProduct, addHistoryEntry } from '@/lib/db'
import { evaluateConditions } from '@/lib/conditions'
import type { Product } from '@/types'

const ALLERGEN_OPTIONS = [
  { tag: 'en:milk',        label: 'Milk / Lactose' },
  { tag: 'en:gluten',      label: 'Gluten' },
  { tag: 'en:wheat',       label: 'Wheat' },
  { tag: 'en:eggs',        label: 'Eggs' },
  { tag: 'en:nuts',        label: 'Tree Nuts' },
  { tag: 'en:peanuts',     label: 'Peanuts' },
  { tag: 'en:fish',        label: 'Fish' },
  { tag: 'en:crustaceans', label: 'Shellfish' },
  { tag: 'en:meat',        label: 'Meat' },
  { tag: 'en:pork',        label: 'Pork' },
  { tag: 'en:alcohol',     label: 'Alcohol' },
] as const

export default function ProductSubmitPage() {
  const { ean } = useParams<{ ean: string }>()
  const navigate = useNavigate()
  const { setFound } = useScanStore()
  const { activeConditions } = useFilterStore()

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [allergens, setAllergens] = useState<Set<string>>(new Set())
  const [traces, setTraces] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, tag: string) {
    setter(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    setError('')

    const product: Product = {
      ean: ean!,
      name: name.trim(),
      brand: brand.trim() || null,
      image_url: null,
      nutriscore: null,
      ingredients_text: ingredients.trim() || null,
      allergens_tags: [...allergens],
      traces_tags: [...traces],
      nutriments: {},
      source: 'community',
    }

    try {
      await submitCustomProduct({
        ean: ean!,
        name: product.name,
        brand: brand.trim(),
        ingredients_text: ingredients.trim(),
        allergens_tags: product.allergens_tags,
        traces_tags: product.traces_tags,
      })

      await cacheProduct(product)
      const results = evaluateConditions(activeConditions, product)
      setFound(product, results, null)

      await addHistoryEntry({
        ean: ean!,
        product_name: product.name,
        image_url: null,
        scanned_at: new Date().toISOString(),
        condition_results: results,
      })

      navigate(`/product/${ean}`, { replace: true })
    } catch {
      setError('Could not save product. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 dark:text-gray-400 text-sm"
        >
          ← Cancel
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Add Product</h1>
          <p className="text-xs text-gray-400">EAN: {ean}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-5">

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Product name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Oat Milk Original"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Brand */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Brand
          </label>
          <input
            type="text"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder="e.g. Oatly"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Ingredients */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Ingredients
          </label>
          <textarea
            rows={3}
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
            placeholder="Paste or type the ingredient list from the label…"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none"
          />
        </div>

        {/* Allergens */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Allergens</span>
            <span className="text-xs font-semibold text-red-500 w-16 text-center">Contains</span>
            <span className="text-xs font-semibold text-yellow-600 w-16 text-center">May contain</span>
          </div>

          {ALLERGEN_OPTIONS.map(({ tag, label }) => (
            <div key={tag} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="text-sm text-gray-800 dark:text-gray-200">{label}</span>

              {/* Contains checkbox */}
              <div className="flex justify-center w-16">
                <input
                  type="checkbox"
                  checked={allergens.has(tag)}
                  onChange={() => toggleSet(setAllergens, tag)}
                  className="w-5 h-5 accent-red-500 cursor-pointer"
                />
              </div>

              {/* May contain checkbox */}
              <div className="flex justify-center w-16">
                <input
                  type="checkbox"
                  checked={traces.has(tag)}
                  onChange={() => toggleSet(setTraces, tag)}
                  className="w-5 h-5 accent-yellow-500 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full rounded-xl bg-green-600 text-white py-3 font-medium text-sm disabled:opacity-50 mt-1"
        >
          {submitting ? 'Saving…' : 'Save Product'}
        </button>

      </form>
    </div>
  )
}
