import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIModeState {
  isAdvancedMode: boolean;
  isInitialized: boolean;
  setAdvancedMode: (isAdvanced: boolean) => void;
}

const useUIModeStore = create<UIModeState>()(
  persist(
    (set) => ({
      isAdvancedMode: false, // Default to simple mode
      isInitialized: true,
      setAdvancedMode: (isAdvanced: boolean) => {
        set({ isAdvancedMode: isAdvanced });
      },
    }),
    {
      name: 'ui-mode-storage',
    }
  )
);

export default useUIModeStore;
