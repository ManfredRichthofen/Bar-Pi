import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from '@tanstack/react-router';
import { Clock, Settings, GlassWater } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const Dock: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const dockVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
      },
    },
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg"
      initial="hidden"
      animate="visible"
      variants={dockVariants}
    >
      <div className="flex justify-center items-center h-16 sm:h-20 px-4 sm:px-6 max-w-3xl mx-auto gap-4 sm:gap-8">
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0"
        >
          <Link
            to="/simple/drinks"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-all duration-200 min-w-[80px] sm:min-w-[100px]',
              isActive('/simple/drinks')
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted',
            )}
          >
            <motion.div
              animate={
                isActive('/simple/drinks')
                  ? {
                      scale: [1, 1.15, 1],
                      rotate: [0, -5, 5, 0],
                    }
                  : {}
              }
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              <GlassWater className="h-6 w-6" />
            </motion.div>
            <span className="text-xs font-medium">
              {t('navigation.drinks')}
            </span>
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0"
        >
          <Link
            to="/simple/order-status"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-all duration-200 min-w-[80px] sm:min-w-[100px]',
              isActive('/simple/order-status')
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted',
            )}
          >
            <motion.div
              animate={
                isActive('/simple/order-status')
                  ? {
                      scale: [1, 1.15, 1],
                      rotate: [0, -5, 5, 0],
                    }
                  : {}
              }
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              <Clock className="h-6 w-6" />
            </motion.div>
            <span className="text-xs font-medium">
              {t('navigation.order_status')}
            </span>
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0"
        >
          <Link
            to="/simple/settings"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-all duration-200 min-w-[80px] sm:min-w-[100px]',
              isActive('/simple/settings')
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted',
            )}
          >
            <motion.div
              animate={
                isActive('/simple/settings')
                  ? {
                      scale: [1, 1.15, 1],
                      rotate: [0, -5, 5, 0],
                    }
                  : {}
              }
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              <Settings className="h-6 w-6" />
            </motion.div>
            <span className="text-xs font-medium">
              {t('navigation.settings')}
            </span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dock;
