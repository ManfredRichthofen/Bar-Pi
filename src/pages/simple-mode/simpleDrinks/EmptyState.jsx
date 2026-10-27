import { GlassWater, RefreshCw, Search, WifiOff } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  enterAnimate,
  enterInitial,
  enterTransition,
  noneTransition,
} from '@/lib/simpleMotion';

const EmptyState = ({ type = 'no-results', onClearFilters, onRetry }) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const states = {
    'no-results': {
      icon: Search,
      title: t('simple_drinks.empty_results_title', 'No Drinks Found'),
      description: t(
        'simple_drinks.empty_results_description',
        "Try adjusting your search or filters to find what you're looking for.",
      ),
      action: onClearFilters ? (
        <Button onClick={onClearFilters} variant="outline" size="lg">
          {t('simple_drinks.clear_search_filters', 'Clear search and filters')}
        </Button>
      ) : null,
    },
    'no-drinks': {
      icon: GlassWater,
      title: t('simple_drinks.empty_none_title', 'No Drinks Available'),
      description: t(
        'simple_drinks.empty_none_description',
        'No drinks are set up yet. Ask your host to add some to the bar.',
      ),
      action: null,
    },
    error: {
      icon: WifiOff,
      title: t('simple_drinks.error_title', "Couldn't load drinks"),
      description: t(
        'simple_drinks.error_description',
        'Check that the bar is switched on and connected, then try again.',
      ),
      action: onRetry ? (
        <Button onClick={onRetry} variant="outline" size="lg">
          <RefreshCw />
          {t('common.retry', 'Try again')}
        </Button>
      ) : null,
    },
  };

  const state = states[type] || states['no-results'];
  const Icon = state.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <motion.div
        initial={reduceMotion ? false : enterInitial}
        animate={enterAnimate}
        transition={reduceMotion ? noneTransition : enterTransition}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-surface-sunken flex items-center justify-center">
                <Icon className="w-10 h-10 text-foreground-muted" />
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">{state.title}</h3>

            <p className="text-foreground-muted mb-6 max-w-sm mx-auto">
              {state.description}
            </p>

            {state.action}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmptyState;
