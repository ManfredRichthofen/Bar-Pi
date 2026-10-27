import { useNavigate, useRouter } from '@tanstack/react-router';
import { useCallback } from 'react';

/**
 * Go back in history when there is an in-app entry to return to (keeps the
 * previous page's scroll position); otherwise navigate to `fallback`.
 */
export function useBackNavigation(fallback: string) {
  const router = useRouter();
  const navigate = useNavigate();

  return useCallback(() => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      void navigate({ to: fallback });
    }
  }, [router, navigate, fallback]);
}
