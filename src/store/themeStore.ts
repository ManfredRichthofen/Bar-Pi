import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeId = 'light' | 'dark';

export const THEMES: { id: ThemeId; label: string; description: string }[] = [
  { id: 'light', label: 'Light Mode', description: 'Clean and bright' },
  { id: 'dark', label: 'Dark Mode', description: 'Low glare, near black' },
];

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

// Legacy: night→dark; daylight/soft→light
const normalize = (value: unknown): ThemeId => {
  if (value === 'dark' || value === 'night') return 'dark';
  return 'light';
};

const applyTheme = (theme: ThemeId) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
};

// Read the stored theme immediately to prevent a flash on load
const getInitialTheme = (): ThemeId => {
  if (typeof window === 'undefined') return 'light';

  let theme: ThemeId | null = null;
  try {
    const stored = localStorage.getItem('theme-storage');
    if (stored) theme = normalize(JSON.parse(stored).state?.theme);
  } catch (error) {
    console.error('Failed to load theme from storage:', error);
  }

  if (!theme) {
    theme = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
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
      version: 2,
      migrate: (persisted) => ({
        theme: normalize((persisted as { theme?: unknown })?.theme),
      }),
    },
  ),
);

export default useThemeStore;
