import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilterStore {
  activeConditions: string[]
  setConditions: (ids: string[]) => void
  toggleCondition: (id: string) => void
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      activeConditions: [],
      setConditions: (ids) => set({ activeConditions: ids }),
      toggleCondition: (id) => {
        const current = get().activeConditions
        set({
          activeConditions: current.includes(id)
            ? current.filter(c => c !== id)
            : [...current, id],
        })
      },
    }),
    { name: 'nutriscan-filters' }
  )
)
