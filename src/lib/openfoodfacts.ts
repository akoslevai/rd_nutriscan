import type { Product } from '@/types'

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const FIELDS = 'product_name,brands,image_front_url,nutriscore_grade,ingredients_text,allergens_tags,traces_tags,nutriments'

export class ProductNotFoundError extends Error {}
export class ProductFetchError extends Error {}

export async function fetchProduct(ean: string): Promise<{ product: Product; raw: unknown }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(`${OFF_BASE}/${ean}.json?fields=${FIELDS}`, {
      signal: controller.signal,
    })
    if (!res.ok) throw new ProductFetchError(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.status === 0 || !data.product) throw new ProductNotFoundError(ean)

    const p = data.product
    return {
      product: {
        ean,
        name: p.product_name || ean,
        brand: p.brands || null,
        image_url: p.image_front_url || null,
        nutriscore: p.nutriscore_grade || null,
        ingredients_text: p.ingredients_text || null,
        allergens_tags: p.allergens_tags ?? [],
        traces_tags: p.traces_tags ?? [],
        nutriments: p.nutriments ?? {},
        source: 'openfoodfacts',
      },
      raw: data.product,
    }
  } catch (err) {
    if (err instanceof ProductNotFoundError) throw err
    if (err instanceof Error && err.name === 'AbortError') throw new ProductFetchError('Request timed out')
    throw new ProductFetchError('Network error')
  } finally {
    clearTimeout(timeout)
  }
}
