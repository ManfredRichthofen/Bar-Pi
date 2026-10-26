import { create } from 'zustand';

export const usePumpStore = create((set) => ({
  // State
  pumps: [],
  isAllowReversePumping: false,
  loading: false,
  error: null,

  // Actions (list fetch lives in usePumps / React Query)
  setPumps: (pumps) => set({ pumps }),

  setAllowReversePumping: (isAllowed) =>
    set({ isAllowReversePumping: isAllowed }),

  updatePump: (pumpId, updates) => {
    set((state) => ({
      pumps: state.pumps.map((pump) =>
        pump.id === pumpId ? { ...pump, ...updates } : pump,
      ),
    }));
  },

  addPump: (pump) => {
    set((state) => ({
      pumps: [...state.pumps, pump],
    }));
  },

  removePump: (pumpId) => {
    set((state) => ({
      pumps: state.pumps.filter((pump) => pump.id !== pumpId),
    }));
  },

  clearError: () => set({ error: null }),
}));
