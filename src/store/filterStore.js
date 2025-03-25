import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFilterStore = create(
  persist(
    (set) => ({
      filters: {
        automatic: false,
        manual: false,
        fabricable: false,
      },
      setFilters: (filters) => set({ filters }),
      updateFilter: (filterName, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [filterName]: value,
          },
        })),
      clearFilters: () =>
        set({
          filters: {
            automatic: false,
            manual: false,
            fabricable: false,
          },
        }),
    }),
    {
      name: 'simple-drinks-filters',
    },
  ),
);

export default useFilterStore;
