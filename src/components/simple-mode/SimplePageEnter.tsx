import { m, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import {
  enterAnimate,
  enterInitial,
  enterTransition,
  noneTransition,
} from '@/lib/motionPresets';

type SimplePageEnterProps = {
  children: ReactNode;
  className?: string;
};

/** One-shot content enter for simple-mode pages (chrome stays outside). */
const SimplePageEnter = ({ children, className }: SimplePageEnterProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      initial={reduceMotion ? false : enterInitial}
      animate={enterAnimate}
      transition={reduceMotion ? noneTransition : enterTransition}
    >
      {children}
    </m.div>
  );
};

export default SimplePageEnter;
