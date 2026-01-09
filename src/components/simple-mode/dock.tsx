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
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/50 shadow-xl"
      initial="hidden"
      animate="visible"
      variants={dockVariants}
    >
      <div className="flex justify-center items-center h-16 sm:h-18 px-4 sm:px-6 max-w-3xl mx-auto gap-3 sm:gap-6">
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 max-w-[110px]"
        >
          <Link
            to="/simple/drinks"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl transition-all duration-200 w-full',
              isActive('/simple/drinks')
                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md'
                : 'text-foreground/60 hover:text-foreground hover:bg-muted/50',
            )}
          >
            <GlassWater className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-xs font-medium">
              {t('navigation.drinks')}
            </span>
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 max-w-[110px]"
        >
          <Link
            to="/simple/order-status"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl transition-all duration-200 w-full',
              isActive('/simple/order-status')
                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md'
                : 'text-foreground/60 hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Clock className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-xs font-medium">
              {t('navigation.order_status')}
            </span>
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 max-w-[110px]"
        >
          <Link
            to="/simple/settings"
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl transition-all duration-200 w-full',
              isActive('/simple/settings')
                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md'
                : 'text-foreground/60 hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Settings className="h-6 w-6 sm:h-7 sm:w-7" />
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
