import { supabase } from './supabase'
import { getAnonymousId } from './identity'

export interface ScanEvent {
  ean: string
  product_source: 'openfoodfacts' | 'community' | 'not_found'
  product_name: string | null
  active_conditions: number
}

export function logScanEvent(data: ScanEvent): void {
  supabase.from('scan_events').insert({
    anonymous_id: getAnonymousId(),
    ean: data.ean,
    product_source: data.product_source,
    product_name: data.product_name,
    active_conditions: data.active_conditions,
  }).then(() => {})  // fire-and-forget, never blocks the UI
}
