import type { Transition, Variants } from 'motion/react';

/** Interactive feedback — short tween, no spring cost on many cards. */
export const interactiveTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

/** Page / panel enter — slightly longer, still GPU-cheap (opacity + translate). */
export const enterTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

export const pressHover = { y: -4, scale: 1.02 } as const;
export const pressTap = { scale: 0.98 } as const;

export const enterInitial = { opacity: 0, y: 8 } as const;
export const enterAnimate = { opacity: 1, y: 0 } as const;

export const fadeInitial = { opacity: 0, scale: 0.92 } as const;
export const fadeAnimate = { opacity: 1, scale: 1 } as const;

export const imageFadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: enterTransition },
};

export const pulseAnimate = { scale: [1, 1.2, 1] };
export const pulseTransition: Transition = {
  duration: 1.5,
  repeat: Number.POSITIVE_INFINITY,
  ease: 'easeInOut',
};

export const noneTransition: Transition = { duration: 0 };
