import { useReducedMotion } from 'motion/react';
import {
  interactiveTransition,
  noneTransition,
  pressHover,
  pressTap,
} from '@/lib/motionPresets';

/** Shared press/lift props for interactive surfaces (simple and advanced mode). */
export function usePress(options?: { lift?: boolean }) {
  const reduceMotion = useReducedMotion();
  const lift = options?.lift !== false;

  if (reduceMotion) {
    return {
      whileHover: undefined,
      whileTap: undefined,
      transition: noneTransition,
    };
  }

  return {
    whileHover: lift ? pressHover : undefined,
    whileTap: pressTap,
    transition: interactiveTransition,
  };
}
