import React from 'react';

const SimpleDrinkCardSkeleton = () => {
  return (
    <div className="card bg-base-100 shadow-md h-full overflow-hidden">
      {/* Image skeleton with shimmer effect */}
      <div className="relative aspect-[16/9] sm:aspect-[3/2]">
        <div className="absolute inset-0 bg-base-200" />
        <div
          className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>

      <div className="card-body p-2 sm:p-3">
        {/* Title and badge skeleton */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1">
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

        {/* Description skeleton */}
        <div className="space-y-1.5 mb-1 sm:mb-2">
          <div className="h-2 sm:h-3 bg-base-200 rounded-full w-full relative overflow-hidden">
            <div
              className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
          <div className="h-2 sm:h-3 bg-base-200 rounded-full w-4/5 relative overflow-hidden">
            <div
              className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
        </div>

        {/* Ingredients skeleton */}
        <div className="mt-auto space-y-2">
          <div className="h-3 sm:h-4 bg-base-200 rounded-full w-1/3 relative overflow-hidden">
            <div
              className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
          <div className="space-y-1.5">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-base-200 relative overflow-hidden">
                  <div
                    className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
                    style={{ backgroundSize: '200% 100%' }}
                  />
                </div>
                <div
                  className={`h-2 sm:h-3 bg-base-200 rounded-full relative overflow-hidden ${index === 0 ? 'w-3/4' : index === 1 ? 'w-2/3' : 'w-1/2'}`}
                >
                  <div
                    className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-100/10 to-transparent"
                    style={{ backgroundSize: '200% 100%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCardSkeleton;
