import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const DrinkCardSkeleton = () => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        {/* Image skeleton */}
        <Skeleton className="w-full aspect-square" />

        {/* Content skeleton */}
        <div className="p-3 sm:p-4 space-y-2">
          {/* Title */}
          <Skeleton className="h-5 w-3/4" />

          {/* Description */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />

          {/* Badge/Tag area */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrinkCardSkeleton;
