import { createPersistedStore } from './createStore';
import { DEFAULT_VALUES, UI_MODES } from '../constants';

const useUIModeStore = createPersistedStore(
  'ui-mode',
  { 
    isAdvancedMode: DEFAULT_VALUES.UI_MODE === UI_MODES.ADVANCED,
    isInitialized: true 
  },
  (set: any) => ({
    setAdvancedMode: (isAdvanced: boolean) => {
      set({ isAdvancedMode: isAdvanced });
    },
  })
);

export default useUIModeStore;
