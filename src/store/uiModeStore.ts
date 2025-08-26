import { create } from "zustand";

interface UIModeState {
	isAdvancedMode: boolean;
	isInitialized: boolean;
	setAdvancedMode: (isAdvanced: boolean) => void;
}

const useUIModeStore = create<UIModeState>((set) => {
	// Initialize localStorage with 'simple' if no value exists
	const storedMode = localStorage.getItem("uiMode");
	if (!storedMode) {
		localStorage.setItem("uiMode", "simple");
	}

	return {
		isAdvancedMode: storedMode === "advanced",
		isInitialized: true,
		setAdvancedMode: (isAdvanced: boolean) => {
			localStorage.setItem("uiMode", isAdvanced ? "advanced" : "simple");
			set({ isAdvancedMode: isAdvanced });
		},
	};
});

export default useUIModeStore;
