import { useEffect, useRef } from 'react';
import type { Glass } from '../pages/Shared/order/types';
import { useGlassesList } from './useGlassesList';

interface UseGlassesOptions {
  token: string | null;
  defaultGlass?: Glass | null;
  selectedGlass: Glass | null;
  setSelectedGlass: (glass: Glass | null) => void;
  onGlassChange?: (glass: Glass | null) => void;
}

/**
 * Shared glass list fetch + one-time default/auto selection used by both
 * Advanced (Select) and Simple (Dialog) GlassSelector wrappers.
 * Uses React Query via useGlassesList for a shared cache with the Glasses page.
 */
export function useGlasses({
  token,
  defaultGlass = null,
  selectedGlass,
  setSelectedGlass,
  onGlassChange,
}: UseGlassesOptions) {
  const { data, isLoading, isPending } = useGlassesList();
  const glasses = (data ?? []) as Glass[];
  const loading = !token ? false : isLoading || isPending;
  const hasInitialized = useRef(false);

  const defaultGlassRef = useRef(defaultGlass);
  const selectedGlassRef = useRef(selectedGlass);
  const setSelectedGlassRef = useRef(setSelectedGlass);
  const onGlassChangeRef = useRef(onGlassChange);
  defaultGlassRef.current = defaultGlass;
  selectedGlassRef.current = selectedGlass;
  setSelectedGlassRef.current = setSelectedGlass;
  onGlassChangeRef.current = onGlassChange;

  useEffect(() => {
    if (!token || glasses.length === 0 || hasInitialized.current) return;

    hasInitialized.current = true;
    const currentDefault = defaultGlassRef.current;
    const currentSelected = selectedGlassRef.current;

    const matchedDefault = currentDefault
      ? glasses.find((g) => g.id === currentDefault.id)
      : undefined;

    if (matchedDefault) {
      setSelectedGlassRef.current(matchedDefault);
      onGlassChangeRef.current?.(matchedDefault);
    } else if (!currentSelected) {
      setSelectedGlassRef.current(glasses[0]);
      onGlassChangeRef.current?.(glasses[0]);
    }
  }, [token, glasses]);

  const selectGlass = (glass: Glass | null) => {
    setSelectedGlass(glass);
    onGlassChange?.(glass);
  };

  const selectGlassById = (glassId: string) => {
    const glass = glasses.find((g) => g.id === glassId) ?? null;
    if (glass) {
      selectGlass(glass);
    }
    return glass;
  };

  return {
    loading,
    glasses,
    selectGlass,
    selectGlassById,
  };
}
