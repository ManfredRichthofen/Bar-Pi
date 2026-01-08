import { Check, AlertTriangle, Square, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface StatusCardProps {
  recipeName: string;
  state: string;
  progress: number;
  onCancel: () => void;
  canceling: boolean;
}

const StatusCard = ({
  recipeName,
  state,
  progress,
  onCancel,
  canceling,
}: StatusCardProps) => {
  const getStatusIcon = () => {
    switch (state) {
      case 'FINISHED':
        return <Check className="w-8 h-8 sm:w-10 sm:h-10" />;
      case 'CANCELLED':
        return <XCircle className="w-8 h-8 sm:w-10 sm:h-10" />;
      case 'MANUAL_ACTION_REQUIRED':
      case 'MANUAL_INGREDIENT_ADD':
        return <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />;
      default:
        return <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'FINISHED':
        return 'text-green-600 dark:text-green-400 bg-green-500/10';
      case 'CANCELLED':
        return 'text-red-600 dark:text-red-400 bg-red-500/10';
      case 'MANUAL_ACTION_REQUIRED':
      case 'MANUAL_INGREDIENT_ADD':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10';
    }
  };

  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-4 sm:p-6 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 break-words">
              {recipeName}
            </h2>
            <Badge variant="secondary" className="capitalize text-xs sm:text-sm">
              {state.toLowerCase().replace(/_/g, ' ')}
            </Badge>
          </div>
          
          {/* Status Icon */}
          <div className={`rounded-2xl p-3 sm:p-4 ${getStatusColor()} transition-all duration-300`}>
            {getStatusIcon()}
          </div>
        </div>

        {/* Progress Section */}
        <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">
              {progress}%
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              {state === 'FINISHED' ? 'Complete!' : state === 'CANCELLED' ? 'Cancelled' : 'In Progress'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="w-full h-3 sm:h-4" 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="mt-4 sm:mt-6">
          <Button
            variant="destructive"
            onClick={onCancel}
            disabled={canceling || ['CANCELLED', 'FINISHED'].includes(state)}
            className="w-full gap-2"
            size="lg"
          >
            <Square className="w-4 h-4" />
            {canceling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
