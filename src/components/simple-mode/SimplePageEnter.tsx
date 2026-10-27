import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import {
  enterAnimate,
  enterInitial,
  enterTransition,
  noneTransition,
} from '@/lib/simpleMotion';

type SimplePageEnterProps = {
  children: ReactNode;
  className?: string;
};

/** One-shot content enter for simple-mode pages (chrome stays outside). */
const SimplePageEnter = ({ children, className }: SimplePageEnterProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : enterInitial}
      animate={enterAnimate}
      transition={reduceMotion ? noneTransition : enterTransition}
    >
      {children}
    </motion.div>
  );
};

export default SimplePageEnter;
