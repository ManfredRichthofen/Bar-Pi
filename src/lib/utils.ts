import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * tailwind-merge must know the design system's own utilities, otherwise it reads
 * `border-control` as a border colour and drops it next to `border-border-strong`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'border-w': [{ border: ['control', 'hairline'] }],
      'border-w-t': [{ 'border-t': ['control', 'hairline'] }],
      'border-w-b': [{ 'border-b': ['control', 'hairline'] }],
      'border-w-l': [{ 'border-l': ['control', 'hairline'] }],
      'border-w-r': [{ 'border-r': ['control', 'hairline'] }],
      shadow: [{ shadow: ['inset', 'pressed'] }],
      rounded: [{ rounded: ['control'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
