import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from './components/ui/toast';
import './lib/apiClient';
// Applies the saved theme to <html> on startup, not only when Settings opens.
import './store/themeStore';
import { queryClient } from './lib/queryClient';
import './index.css';
import './i18n';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Save current route before page unload
window.addEventListener('beforeunload', () => {
  const currentPath = window.location.pathname + window.location.search;
  localStorage.setItem('lastRoute', currentPath);
});

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Restore last route on page load
const lastRoute = localStorage.getItem('lastRoute');
if (
  lastRoute &&
  lastRoute !== window.location.pathname + window.location.search
) {
  // Only restore if we're at root or a different path
  const currentPath = window.location.pathname;
  if (currentPath === '/' || currentPath === '') {
    window.history.replaceState({}, '', lastRoute);
  }
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <TanStackRouterDevtools router={router} />
        <Toaster />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
