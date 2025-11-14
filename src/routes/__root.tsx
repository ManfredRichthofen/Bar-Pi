import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';
import { StatusBar, Style } from '@capacitor/status-bar';

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

  if (dark) {
    await StatusBar.setBackgroundColor({ color: '#020617' });
    await StatusBar.setStyle({ style: Style.Light });
  } else {
    await StatusBar.setBackgroundColor({ color: '#f9fafb' });
    await StatusBar.setStyle({ style: Style.Dark });
  }

  await StatusBar.setOverlaysWebView({ overlay: false });
}

function RootComponent() {
  const reinitializeAuthState = useAuthStore(
    (state) => state.reinitializeAuthState,
  );
  const { i18n } = useTranslation();
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const { isInitialized: isUIModeInitialized } = useUIModeStore();

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
    // Theme initialization
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeChange(false);
    applyStatusBarForTheme(savedTheme);

    // Language initialization
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en-US';
    i18n.changeLanguage(savedLanguage);

    // Theme observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          if (newTheme) {
            localStorage.setItem('theme', newTheme);
            applyStatusBarForTheme(newTheme);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show nothing while initializing to prevent flash of incorrect content
  if (!isAuthInitialized || !isUIModeInitialized) {
    return null;
  }

  return <Outlet />;
}
