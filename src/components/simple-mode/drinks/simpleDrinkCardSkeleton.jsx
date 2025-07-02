import React from 'react';

const SimpleDrinkCardSkeleton = () => {
  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden border border-base-200 w-full p-2 sm:p-2.5 md:p-3">
      <div className="flex flex-col">
        {/* Image skeleton - fixed aspect ratio */}
        <figure className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-sm bg-base-200 flex-shrink-0 mb-2">
          <div
            className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
            style={{ backgroundSize: '200% 100%' }}
          />
        </figure>

        {/* Content skeleton - with consistent bottom margin */}
        <div className="flex flex-col flex-shrink-0">
          <div className="flex items-start gap-2 mb-1">
            <div className="h-3 sm:h-4 md:h-5 bg-base-200 rounded-full w-2/3 relative overflow-hidden flex-1 min-w-0">
              <div
                className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
            <div className="h-3 sm:h-4 w-6 sm:w-8 bg-base-200 rounded-full relative overflow-hidden shrink-0 flex-shrink-0">
              <div
                className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCardSkeleton;
