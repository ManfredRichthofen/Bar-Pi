import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_VALUES, UI_MODES } from '../constants';

interface UIModeState {
  isAdvancedMode: boolean;
  isInitialized: boolean;
  setAdvancedMode: (isAdvanced: boolean) => void;
}

const useUIModeStore = create<UIModeState>()(
  persist(
    (set) => ({
      isAdvancedMode: DEFAULT_VALUES.UI_MODE === UI_MODES.ADVANCED,
      isInitialized: true,
      setAdvancedMode: (isAdvanced: boolean) => {
        set({ isAdvancedMode: isAdvanced });
      },
    }),
    {
      name: 'ui-mode-storage',
    },
  ),
);

export default useUIModeStore;
