import { create } from 'zustand';

export const usePumpStore = create((set) => ({
  pumps: [],
  isAllowReversePumping: false,
  loading: false,
  error: null,

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
