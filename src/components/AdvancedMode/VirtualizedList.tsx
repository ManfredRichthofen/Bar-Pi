import { useWindowVirtualizer } from '@tanstack/react-virtual';
import React, { ReactNode, useRef } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimatedSize?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimatedSize = 120,
  overscan = 5,
  className = '',
}: VirtualizedListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const parentOffsetRef = useRef(0);

  React.useLayoutEffect(() => {
    parentOffsetRef.current = listRef.current?.offsetTop || 0;
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimatedSize,
    overscan,
    scrollMargin: parentOffsetRef.current,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={listRef} className={`relative ${className}`}>
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
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            if (!item) return null;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
              >
                {renderItem(item, virtualItem.index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
