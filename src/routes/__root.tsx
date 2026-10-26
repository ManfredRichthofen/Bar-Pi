import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore';

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">
          404
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Page Not Found
        </p>
        <p className="mt-2 text-gray-500 dark:text-gray-500">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});

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

  // Language initialization
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en-US';
    i18n.changeLanguage(savedLanguage);

  }, [i18n]);

  // Show nothing while initializing to prevent flash of incorrect content
  if (!isAuthInitialized || !isUIModeInitialized) {
    return null;
  }

  return <Outlet />;
}
