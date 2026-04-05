import { create } from 'zustand'
import type { Product, ConditionResult } from '@/types'

type ScanStatus = 'idle' | 'scanning' | 'loading' | 'found' | 'not_found' | 'error'

interface ScanStore {
  status: ScanStatus
  product: Product | null
  conditionResults: ConditionResult[]
  errorMessage: string | null
  setScanning: () => void
  setLoading: () => void
  setFound: (product: Product, results: ConditionResult[]) => void
  setNotFound: () => void
  setError: (message: string) => void
  reset: () => void
}

export const useScanStore = create<ScanStore>((set) => ({
  status: 'idle',
  product: null,
  conditionResults: [],
  errorMessage: null,
  setScanning: () => set({ status: 'scanning', product: null, conditionResults: [], errorMessage: null }),
  setLoading: () => set({ status: 'loading' }),
  setFound: (product, conditionResults) => set({ status: 'found', product, conditionResults, errorMessage: null }),
  setNotFound: () => set({ status: 'not_found', product: null, conditionResults: [] }),
  setError: (message) => set({ status: 'error', errorMessage: message }),
  reset: () => set({ status: 'idle', product: null, conditionResults: [], errorMessage: null }),
}))
