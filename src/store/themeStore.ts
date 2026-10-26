import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeId = 'daylight' | 'night' | 'soft';

export const THEMES: { id: ThemeId; label: string; description: string }[] = [
  { id: 'daylight', label: 'Daylight', description: 'Clean and bright' },
  { id: 'night', label: 'Night', description: 'Low glare, near black' },
  { id: 'soft', label: 'Soft', description: 'Raised, tactile controls' },
];

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

// Older versions stored 'light' | 'dark'
const normalize = (value: unknown): ThemeId => {
  if (value === 'night' || value === 'dark') return 'night';
  if (value === 'soft') return 'soft';
  return 'daylight';
};

const applyTheme = (theme: ThemeId) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Night is the only dark theme; keep the legacy class for any `.dark` selectors
  root.classList.toggle('dark', theme === 'night');
};

// Read the stored theme immediately to prevent a flash on load
const getInitialTheme = (): ThemeId => {
  if (typeof window === 'undefined') return 'daylight';

  let theme: ThemeId | null = null;
  try {
    const stored = localStorage.getItem('theme-storage');
    if (stored) theme = normalize(JSON.parse(stored).state?.theme);
  } catch (error) {
    console.error('Failed to load theme from storage:', error);
  }

  if (!theme) {
    theme = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'night'
      : 'daylight';
  }
  applyTheme(theme);
  return theme;
};

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted) => ({
        theme: normalize((persisted as { theme?: unknown })?.theme),
      }),
    },
  ),
);

export default useThemeStore;
