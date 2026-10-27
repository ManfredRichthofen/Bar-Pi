import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'es-toolkit';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRecipesInfinite } from '@/hooks/useRecipesInfinite';
import {
  getGridColsClass,
  useResponsiveDrinkGrid,
} from '@/hooks/useResponsiveDrinkGrid';

const LAYOUT = {
  advanced: {
    accountForSidebar: true,
    // HeaderBar (h-16) + sticky search header
    scrollMargin: () => 64 + 140,
    rowPaddingClass: 'px-4 sm:px-6 lg:px-8',
    gridGapClass: 'gap-4',
    gridExtraClass: 'py-3',
  },
  simple: {
    accountForSidebar: false,
    scrollMargin: (listRef) => listRef.current?.offsetTop || 0,
    rowPaddingClass: 'px-4 sm:px-6 lg:px-8 py-2',
    gridGapClass: 'gap-4 sm:gap-5 lg:gap-6',
    gridExtraClass: '',
  },
};

const PENDING_SKELETON_KEYS = [
  'pending-1',
  'pending-2',
  'pending-3',
  'pending-4',
  'pending-5',
  'pending-6',
  'pending-7',
  'pending-8',
  'pending-9',
  'pending-10',
  'pending-11',
  'pending-12',
];

const NEXT_PAGE_SKELETON_KEYS = ['next-1', 'next-2', 'next-3', 'next-4'];

const EMPTY_SLOT_KEYS = [
  'slot-1',
  'slot-2',
  'slot-3',
  'slot-4',
  'slot-5',
  'slot-6',
];

/**
 * Shared window-virtualized recipes grid for Advanced + Simple drinks pages.
 *
 * Layout variants control density / sidebar-aware columns / scroll margin.
 * Card, skeleton, and empty UI are injected so each mode keeps its look.
 */
function VirtualRecipesGrid({
  token,
  searchTerm,
  filters,
  fabricableRecipes,
  onCheckFabricability,
  onFilterRecipes,
  mode = 'simple',
  collapsed = false,
  renderCard,
  renderSkeleton,
  renderEmpty,
  renderError,
  loadingLabel = 'Loading drinks...',
  noMoreLabel = 'No more drinks to load',
  emptyFallback,
}) {
  const layout = LAYOUT[mode] ?? LAYOUT.simple;
  const listRef = useRef(null);
  const parentOffsetRef = useRef(0);

  const { itemsPerRow, rowHeight } = useResponsiveDrinkGrid({
    collapsed,
    accountForSidebar: layout.accountForSidebar,
  });

  const {
    status,
    data,
    error,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useRecipesInfinite({
    token,
    searchTerm,
    filters,
    fabricableRecipes,
    onCheckFabricability,
    onFilterRecipes,
    mode,
  });

  // Re-measure when status changes so simple-mode offsetTop is read after the list mounts
  useLayoutEffect(() => {
    parentOffsetRef.current =
      typeof layout.scrollMargin === 'function'
        ? layout.scrollMargin(listRef)
        : layout.scrollMargin;
  }, [layout, status]);

  const allRecipes = data ? data.pages.flatMap((d) => d.content) : [];
  const rowCount = Math.ceil(allRecipes.length / itemsPerRow);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 8,
    scrollMargin: parentOffsetRef.current,
    measureElement: (el) => el?.getBoundingClientRect?.().height || rowHeight,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const colsClass = getGridColsClass(itemsPerRow);

  // Prefetch next page when close to the end of virtualized rows
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();
    if (!lastItem) return;

    if (lastItem.index >= rowCount - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, rowCount, isFetchingNextPage, virtualItems]);

  // Also fetch when near the document bottom (covers short lists / fast scroll)
  useEffect(() => {
    const handleScroll = debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const remainingScroll = scrollHeight - scrollTop - clientHeight;

      if (remainingScroll < 1000 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  if (status === 'pending') {
    return (
      <div className="space-y-4 px-4 py-2">
        <div className="flex justify-center">
          <div
            className={`grid ${colsClass} gap-4 w-full max-w-screen-2xl mx-auto`}
          >
            {PENDING_SKELETON_KEYS.map((key, index) => (
              <React.Fragment key={key}>
                {renderSkeleton?.({ index })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-base text-foreground-muted">
              {loadingLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    if (renderError) {
      return renderError({ error, retry: () => refetch() });
    }
    return (
      <div className="px-4 py-2">
        <div className="flex justify-center">
          <Alert variant="destructive" className="max-w-2xl">
            <AlertCircle className="size-6" />
            <AlertDescription>Error: {error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div ref={listRef} className="relative">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${(virtualItems[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {virtualItems.map((virtualRow) => {
            const rowIndex = virtualRow.index;
            const rowRecipes = allRecipes.slice(
              rowIndex * itemsPerRow,
              rowIndex * itemsPerRow + itemsPerRow,
            );

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={layout.rowPaddingClass}
              >
                <div
                  className={`grid ${colsClass} ${layout.gridGapClass} w-full max-w-screen-2xl mx-auto ${layout.gridExtraClass}`}
                >
                  {rowRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-stretch justify-center w-full"
                    >
                      {renderCard({
                        recipe,
                        isFabricable: fabricableRecipes.has(recipe.id),
                      })}
                    </div>
                  ))}
                  {EMPTY_SLOT_KEYS.slice(
                    0,
                    itemsPerRow - rowRecipes.length,
                  ).map((slotKey) => (
                    <div
                      key={`${rowIndex}-${slotKey}`}
                      className="flex items-stretch justify-center"
                    >
                      <div className="w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isFetchingNextPage && hasNextPage && (
        <div className="flex justify-center px-4 sm:px-6 lg:px-8 py-2">
          <div
            className={`grid ${colsClass} ${layout.gridGapClass} w-full max-w-screen-2xl mx-auto`}
          >
            {NEXT_PAGE_SKELETON_KEYS.map((key, index) => (
              <React.Fragment key={key}>
                {renderSkeleton?.({ index })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {!hasNextPage && !isFetching && allRecipes.length > 0 && (
        <div className="flex items-center justify-center py-8 px-4">
          <p className="text-center text-foreground-muted text-sm">
            {noMoreLabel}
          </p>
        </div>
      )}

      {allRecipes.length === 0 &&
        !isFetching &&
        (renderEmpty?.({ searchTerm, filters }) ?? emptyFallback ?? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-foreground-muted mb-4">
              <Search className="w-16 h-16" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No drinks found</h3>
            <p className="text-foreground-muted text-center text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        ))}
    </div>
  );
}

export default VirtualRecipesGrid;
