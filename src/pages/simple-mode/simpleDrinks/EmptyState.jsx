import { GlassWater, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const EmptyState = ({ type = 'no-results', onClearFilters }) => {
  const states = {
    'no-results': {
      icon: Search,
      title: 'No Drinks Found',
      description: 'Try adjusting your search or filters to find what you\'re looking for.',
      action: onClearFilters ? (
        <Button onClick={onClearFilters} variant="outline" size="lg">
          Clear Filters
        </Button>
      ) : null,
    },
    'no-drinks': {
      icon: GlassWater,
      title: 'No Drinks Available',
      description: 'There are no drinks in the system yet. Please add some drinks to get started.',
      action: null,
    },
    'filtered-out': {
      icon: Filter,
      title: 'All Drinks Filtered Out',
      description: 'Your current filters have hidden all available drinks. Try adjusting your filters.',
      action: onClearFilters ? (
        <Button onClick={onClearFilters} variant="outline" size="lg">
          Clear All Filters
        </Button>
      ) : null,
    },
  };

  const state = states[type] || states['no-results'];
  const Icon = state.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2, 
                type: 'spring', 
                stiffness: 200,
                damping: 15 
              }}
              className="mb-6"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                <Icon className="w-10 h-10 text-muted-foreground/60" />
              </div>
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold mb-2"
            >
              {state.title}
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-6 max-w-sm mx-auto"
            >
              {state.description}
            </motion.p>
            
            {state.action && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {state.action}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmptyState;
