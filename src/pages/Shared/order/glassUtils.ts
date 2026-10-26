import type { Glass } from './types';

/** CocktailPi glasses use `size`; some callers historically used `sizeInMl`. */
export function getGlassSizeMl(glass: Glass | null | undefined): number {
  if (!glass) return 250;
  return glass.size ?? glass.sizeInMl ?? 250;
}
