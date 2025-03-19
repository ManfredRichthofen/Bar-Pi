import React from 'react';

const SimpleDrinkCardSkeleton = () => {
  return (
    <div className="card bg-base-100 shadow-sm h-full overflow-hidden border border-base-200">
      <div className="flex flex-col h-full gap-1.5 p-2 sm:p-3">
        {/* Image skeleton */}
        <figure className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-sm bg-base-200">
          <div
            className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
            style={{ backgroundSize: '200% 100%' }}
          />
        </figure>

        {/* Title and badge skeleton */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="h-4 sm:h-5 bg-base-200 rounded-full w-2/3 relative overflow-hidden">
            <div
              className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
          <div className="h-4 w-8 bg-base-200 rounded-full relative overflow-hidden">
            <div
              className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCardSkeleton;
