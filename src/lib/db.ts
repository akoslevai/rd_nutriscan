import { openDB, type IDBPDatabase } from 'idb'
import type { Product, ScanHistoryEntry } from '@/types'

const DB_NAME = 'nutriscan-db'
const DB_VERSION = 1
const MAX_HISTORY = 50

let _db: IDBPDatabase | null = null

async function getDB() {
  if (!_db) {
    _db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'ean' })
        }
        if (!db.objectStoreNames.contains('scan_history')) {
          const store = db.createObjectStore('scan_history', { keyPath: 'id', autoIncrement: true })
          store.createIndex('scanned_at', 'scanned_at')
        }
      },
    })
  }
  return _db
}

export async function getCachedProduct(ean: string): Promise<Product | undefined> {
  const db = await getDB()
  return db.get('products', ean)
}

export async function cacheProduct(product: Product): Promise<void> {
  const db = await getDB()
  await db.put('products', product)
}

export async function addHistoryEntry(entry: Omit<ScanHistoryEntry, 'id'>): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('scan_history', 'readwrite')
  await tx.store.add(entry)

  // Evict oldest entries if over limit
  const all = await tx.store.index('scanned_at').getAllKeys()
  if (all.length > MAX_HISTORY) {
    const toDelete = all.slice(0, all.length - MAX_HISTORY)
    for (const key of toDelete) await tx.store.delete(key)
  }
  await tx.done
}

export async function getHistory(): Promise<ScanHistoryEntry[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('scan_history', 'scanned_at')
  return all.reverse()
}

export async function clearHistory(): Promise<void> {
  const db = await getDB()
  await db.clear('scan_history')
}
