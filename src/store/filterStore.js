import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FILTERS } from '../utils/recipeFilters';

const useFilterStore = create(
  persist(
    (set) => ({
      filters: { ...DEFAULT_FILTERS },
      setFilters: (filters) => set({ filters }),
      updateFilter: (filterName, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [filterName]: value,
          },
        })),
      clearFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
    }),
    {
      name: 'simple-drinks-filters',
      merge: (persisted, current) => ({
        ...current,
        filters: { ...DEFAULT_FILTERS, ...persisted?.filters },
      }),
    },
  ),
);

export default useFilterStore;
