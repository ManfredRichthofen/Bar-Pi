import { create } from "zustand";

const useCocktailProgressStore = create((set) => ({
	progress: null,
	showProgressDialog: false,

	setProgress: (progress) => set({ progress }),
	clearProgress: () => set({ progress: null }),
	setShowProgressDialog: (show) => set({ showProgressDialog: show }),
}));

export default useCocktailProgressStore;
