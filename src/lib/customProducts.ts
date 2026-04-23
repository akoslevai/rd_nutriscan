import { supabase } from './supabase'
import type { Product } from '@/types'

interface CustomProductRow {
  ean: string
  name: string
  brand: string | null
  ingredients_text: string | null
  allergens_tags: string[]
  traces_tags: string[]
}

function rowToProduct(row: CustomProductRow): Product {
  return {
    ean: row.ean,
    name: row.name,
    brand: row.brand,
    image_url: null,
    nutriscore: null,
    ingredients_text: row.ingredients_text,
    allergens_tags: row.allergens_tags,
    traces_tags: row.traces_tags,
    nutriments: {},
    source: 'community',
  }
}

export async function lookupCustomProduct(ean: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('custom_products')
      .select('ean, name, brand, ingredients_text, allergens_tags, traces_tags')
      .eq('ean', ean)
      .maybeSingle()

    if (error || !data) return null
    return rowToProduct(data as CustomProductRow)
  } catch {
    return null  // Supabase unavailable — fall through to OFF
  }
}

export interface SubmitProductData {
  ean: string
  name: string
  brand: string
  ingredients_text: string
  allergens_tags: string[]
  traces_tags: string[]
}

export async function submitCustomProduct(data: SubmitProductData): Promise<void> {
  const { error } = await supabase.from('custom_products').insert({
    ean: data.ean,
    name: data.name,
    brand: data.brand || null,
    ingredients_text: data.ingredients_text || null,
    allergens_tags: data.allergens_tags,
    traces_tags: data.traces_tags,
  })

  // 23505 = unique_violation — someone else submitted this EAN first, silently skip
  if (error && error.code !== '23505') throw error
}
