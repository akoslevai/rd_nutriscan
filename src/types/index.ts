export interface Product {
  ean: string
  name: string
  brand: string | null
  image_url: string | null
  nutriscore: 'a' | 'b' | 'c' | 'd' | 'e' | null
  ingredients_text: string | null
  allergens_tags: string[]
  traces_tags: string[]
  nutriments: Record<string, number>
  source: 'openfoodfacts' | 'local'
}

export type ConditionStatus = 'safe' | 'unsafe' | 'uncertain'

export interface ConditionResult {
  id: string
  label: string
  status: ConditionStatus
}

export interface ScanHistoryEntry {
  id?: number
  ean: string
  product_name: string
  image_url: string | null
  scanned_at: string
  condition_results: ConditionResult[]
}
