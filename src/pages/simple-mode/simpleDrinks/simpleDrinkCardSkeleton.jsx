import React from 'react';

const SimpleDrinkCardSkeleton = () => {
  return (
    <div className="bg-card shadow-sm overflow-hidden border border-border rounded-lg w-full h-full">
      <div className="flex flex-col h-full">
        {/* Image skeleton - fixed aspect ratio */}
        <figure className="relative w-full aspect-[4/3] rounded-t-lg overflow-hidden bg-muted flex-shrink-0">
          <div
            className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-background/20 to-muted"
            style={{ backgroundSize: '200% 100%' }}
          />
        </figure>

        {/* Content skeleton */}
        <div className="flex flex-col flex-1 p-4">
          {/* Title and badge skeleton */}
          <div className="flex items-start gap-3 mb-3">
            <div className="h-5 bg-muted rounded-full w-2/3 relative overflow-hidden flex-1 min-w-0">
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-background/20 to-muted"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
            <div className="h-5 w-8 bg-muted rounded-full relative overflow-hidden shrink-0 flex-shrink-0">
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-background/20 to-muted"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2 mb-3">
            <div className="h-3 bg-muted rounded-full w-full relative overflow-hidden">
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-background/20 to-muted"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
            <div className="h-3 bg-muted rounded-full w-3/4 relative overflow-hidden">
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-background/20 to-muted"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
          </div>

          {/* Bottom indicator skeleton */}
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted relative overflow-hidden">
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-background/20 to-muted"
                  style={{ backgroundSize: '200% 100%' }}
                />
              </div>
              <div className="h-3 bg-muted rounded-full w-16 relative overflow-hidden">
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-background/20 to-muted"
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
