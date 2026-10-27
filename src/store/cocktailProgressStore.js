import { create } from 'zustand';

const useCocktailProgressStore = create((set) => ({
  progress: null,
  showProgressDialog: false,
  pendingPinAfterDrink: false,

  setProgress: (progress) =>
    set((state) => ({
      progress,
      pendingPinAfterDrink:
        progress?.state === 'COMPLETED' ? true : state.pendingPinAfterDrink,
    })),
  clearProgress: () => set({ progress: null }),
  setShowProgressDialog: (show) => set({ showProgressDialog: show }),
  setPendingPinAfterDrink: (pendingPinAfterDrink) =>
    set({ pendingPinAfterDrink }),
  clearPendingPinAfterDrink: () => set({ pendingPinAfterDrink: false }),
}));

export default useCocktailProgressStore;
