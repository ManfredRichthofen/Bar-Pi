import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoActiveOrderProps {
  onOrderDrink: () => void;
}

const NoActiveOrder = ({ onOrderDrink }: NoActiveOrderProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-muted-foreground/60 mb-4 sm:mb-6">
            <Timer className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
            No Active Order
          </h2>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm">
            There is currently no cocktail being prepared
          </p>
          <Button size="lg" className="w-full" onClick={onOrderDrink}>
            Order a Drink
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoActiveOrder;
