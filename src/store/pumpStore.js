import { create } from 'zustand';
import PumpService from '../services/pump.service';

export const usePumpStore = create((set) => ({
  // State
  pumps: [],
  isAllowReversePumping: false,
  loading: false,
  error: null,

  // Actions
  fetchPumps: async (token) => {
    set({ loading: true });
    try {
      const pumps = await PumpService.getAllPumps(token);
      set({ pumps, error: null });
    } catch (error) {
      set({ error: error.message });
      console.error('Error fetching pumps:', error);
    } finally {
      set({ loading: false });
    }
  },

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
