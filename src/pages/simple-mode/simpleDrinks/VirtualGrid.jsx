import { useInfiniteQuery } from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'es-toolkit';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import React, { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import RecipeService from '../../../services/recipe.service.js';
import SimpleDrinkCard from './simpleDrinkCard.jsx';
import SimpleDrinkCardSkeleton from './simpleDrinkCardSkeleton.jsx';
import EmptyState from './EmptyState.jsx';

function VirtualGrid({
  fabricableRecipes,
  onCardClick,
  token,
  searchTerm,
  filters,
  onCheckFabricability,
  onFilterRecipes,
  onClearFilters,
}) {
  const listRef = React.useRef(null);
  const [itemsPerRow, setItemsPerRow] = React.useState(2);
  const [rowHeight, setRowHeight] = React.useState(320);
  const parentOffsetRef = React.useRef(0);

  React.useLayoutEffect(() => {
    parentOffsetRef.current = listRef.current?.offsetTop || 0;
  }, []);

  // Responsive grid columns and dynamic row height - mobile-first
  React.useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      let cols = 1;
      if (width < 480) {
        // xs
        cols = 1;
      } else if (width < 640) {
        // sm
        cols = 2;
      } else if (width < 768) {
        // md
        cols = 3;
      } else if (width < 1024) {
        // lg
        cols = 4;
      } else if (width < 1280) {
        // xl
        cols = 5;
      } else {
        // 2xl+
        cols = 6;
      }
      setItemsPerRow(cols);

      // Tune row height by column count to avoid overlap at small widths
      const computedRowHeight =
        cols <= 1 ? 520 : cols === 2 ? 420 : cols === 3 ? 360 : 320;
      setRowHeight(computedRowHeight);
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  const {
    status,
    data,
    error,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['recipes', searchTerm, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await RecipeService.getRecipes(
        pageParam,
        null,
        null,
        null,
        null,
        searchTerm,
        null,
        null,
        token,
        false, // includeImage - load images lazily instead
      );

      if (response.content) {
        // Only check fabricability for new recipes
        const newRecipes = response.content.filter(
          (recipe) => !fabricableRecipes.has(recipe.id),
        );
        if (newRecipes.length > 0) {
          await onCheckFabricability(newRecipes);
        }
        response.content = onFilterRecipes(
          response.content,
          filters,
          fabricableRecipes,
        );
      }

      return {
        content: response.content,
        last: response.last,
        nextOffset: pageParam + 1,
      };
    },
    getNextPageParam: (lastGroup) =>
      lastGroup.last ? undefined : lastGroup.nextOffset,
    initialPageParam: 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
    }),
  });

  const allRecipes = data ? data.pages.flatMap((d) => d.content) : [];
  const rowCount = Math.ceil(allRecipes.length / itemsPerRow);
  const totalRowCount = rowCount;

  const virtualizer = useWindowVirtualizer({
    count: totalRowCount,
    estimateSize: () => rowHeight,
    overscan: 8,
    scrollMargin: parentOffsetRef.current,
    measureElement: (el) => el?.getBoundingClientRect?.().height || rowHeight,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Prefetch next page when we're close to the end
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    if (lastItem.index >= rowCount - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    rowCount,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);

  // Optimize scroll handler with debounce
  useEffect(() => {
    const handleScroll = debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const remainingScroll = scrollHeight - scrollTop - clientHeight;
      const scrollThreshold = 1000;

      if (
        remainingScroll < scrollThreshold &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Helper function to get grid columns class based on itemsPerRow
  const getGridColsClass = () => {
    switch (itemsPerRow) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-4';
      case 5:
        return 'grid-cols-5';
      case 6:
        return 'grid-cols-6';
      default:
        return 'grid-cols-2';
    }
  };

  if (status === 'pending') {
    return (
      <div className="space-y-4 px-4 py-2">
        <div className="flex justify-center">
          <div
            className={`grid ${getGridColsClass()} gap-4 w-full max-w-screen-2xl mx-auto`}
          >
            {[...Array(12)].map((_, index) => (
              <SimpleDrinkCardSkeleton
                key={`skeleton-${Date.now()}-${index}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-base text-muted-foreground">
              Loading drinks...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="px-4 py-2">
        <div className="flex justify-center">
          <Alert variant="destructive" className="max-w-2xl">
            <AlertCircle className="w-4 h-4" />
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
                className="px-4 sm:px-6 lg:px-8 py-2"
              >
                <div
                  className={`grid ${getGridColsClass()} gap-4 sm:gap-5 lg:gap-6 w-full max-w-screen-2xl mx-auto`}
                >
                  {rowRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-stretch justify-center w-full"
                    >
                      <SimpleDrinkCard
                        recipe={recipe}
                        isFabricable={fabricableRecipes.has(recipe.id)}
                        onCardClick={onCardClick}
                      />
                    </div>
                  ))}
                  {/* Fill empty slots to maintain grid structure */}
                  {[...Array(itemsPerRow - rowRecipes.length)].map(
                    (_, index) => (
                      <div
                        key={`empty-${rowIndex}-${index}`}
                        className="flex items-stretch justify-center"
                      >
                        <div className="w-full h-full" />
                      </div>
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {isFetchingNextPage && hasNextPage && (
        <div className="flex justify-center px-4 sm:px-6 lg:px-8 py-2">
          <div
            className={`grid ${getGridColsClass()} gap-4 sm:gap-5 lg:gap-6 w-full max-w-screen-2xl mx-auto`}
          >
            {[...Array(4)].map((_, index) => (
              <SimpleDrinkCardSkeleton
                key={`skeleton-${Date.now()}-${index}`}
              />
            ))}
          </div>
        </div>
      )}
      {!hasNextPage && !isFetching && allRecipes.length > 0 && (
        <div className="flex items-center justify-center py-8 px-4">
          <p className="text-center text-muted-foreground text-sm">
            No more drinks to load
          </p>
        </div>
      )}
      {allRecipes.length === 0 && !isFetching && (
        <EmptyState
          type={
            searchTerm || Object.values(filters).some(Boolean)
              ? 'no-results'
              : 'no-drinks'
          }
          onClearFilters={onClearFilters}
        />
      )}
    </div>
  );
}

export default VirtualGrid;
