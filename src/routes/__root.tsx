import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore';
import useThemeStore from '../store/themeStore';
import { useTranslation } from 'react-i18next';
import { StatusBar, Style } from '@capacitor/status-bar';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';

export const Route = createRootRoute({
  component: RootComponent,
});

function isDarkTheme(theme: string) {
  const darkThemes = new Set([
    'dark',
    'night',
    'dracula',
    'dim',
    'nord',
    'business',
    'black',
    'coffee',
    'forest',
    'luxury',
  ]);
  return darkThemes.has(theme);
}

async function applyStatusBarForTheme(theme: string) {
  const dark = isDarkTheme(theme);

  const darkColor = '#020617';
  const lightColor = '#f9fafb';

  await EdgeToEdge.enable();

  await EdgeToEdge.setBackgroundColor({
    color: dark ? darkColor : lightColor,
  });

  await StatusBar.setStyle({
    style: dark ? Style.Light : Style.Dark,
  });

  await StatusBar.setOverlaysWebView({ overlay: false });
}

function RootComponent() {
  const reinitializeAuthState = useAuthStore(
    (state) => state.reinitializeAuthState,
  );
  const { i18n } = useTranslation();
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const { isInitialized: isUIModeInitialized } = useUIModeStore();
  const { theme, setTheme } = useThemeStore();

  // Auth initialization
  useEffect(() => {
    const initialize = async () => {
      await reinitializeAuthState();
      setIsAuthInitialized(true);
    };
    initialize();
  }, [reinitializeAuthState]);

  // Theme and language initialization
  useEffect(() => {
    // Theme initialization - theme store handles persistence
    applyStatusBarForTheme(theme);

    // Language initialization
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en-US';
    i18n.changeLanguage(savedLanguage);

    // Theme observer to sync external changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          const newTheme = isDark ? 'dark' : 'light';
          if (newTheme !== theme) {
            setTheme(newTheme);
            applyStatusBarForTheme(newTheme);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Show nothing while initializing to prevent flash of incorrect content
  if (!isAuthInitialized || !isUIModeInitialized) {
    return null;
  }

  return <Outlet />;
}
