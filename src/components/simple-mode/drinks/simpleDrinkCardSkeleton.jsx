import React from 'react';

const SimpleDrinkCardSkeleton = () => {
  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden border border-base-200 w-full h-full">
      <div className="flex flex-col h-full">
        {/* Image skeleton - fixed aspect ratio */}
        <figure className="relative w-full aspect-[4/3] rounded-t-lg overflow-hidden bg-base-200 flex-shrink-0">
          <div
            className="absolute inset-0 animate-pulse bg-gradient-to-r from-base-200 via-base-100/20 to-base-200"
            style={{ backgroundSize: '200% 100%' }}
          />
        </figure>

        {/* Content skeleton */}
        <div className="flex flex-col flex-1 p-3">
          <div className="flex items-start gap-2 mb-2">
            <div className="h-4 bg-base-200 rounded-full w-2/3 relative overflow-hidden flex-1 min-w-0">
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-base-200 via-base-100/20 to-base-200"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
            <div className="h-4 w-8 bg-base-200 rounded-full relative overflow-hidden shrink-0 flex-shrink-0">
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-base-200 via-base-100/20 to-base-200"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
          </div>
          
          {/* Bottom indicator skeleton */}
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-base-200 relative overflow-hidden">
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-r from-base-200 via-base-100/20 to-base-200"
                  style={{ backgroundSize: '200% 100%' }}
                />
              </div>
              <div className="h-3 bg-base-200 rounded-full w-16 relative overflow-hidden">
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-r from-base-200 via-base-100/20 to-base-200"
                  style={{ backgroundSize: '200% 100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCardSkeleton;
