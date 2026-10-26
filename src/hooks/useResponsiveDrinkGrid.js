import { useEffect, useState } from 'react';

function columnsForWidth(availableWidth) {
  if (availableWidth < 480) return 1;
  if (availableWidth < 640) return 2;
  if (availableWidth < 768) return 3;
  if (availableWidth < 1024) return 4;
  if (availableWidth < 1280) return 5;
  return 6;
}

function rowHeightForColumns(cols) {
  if (cols <= 1) return 520;
  if (cols === 2) return 420;
  if (cols === 3) return 360;
  return 320;
}

export function getGridColsClass(itemsPerRow) {
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
}

/**
 * Responsive column count + estimated row height for drinks virtual grids.
 *
 * @param {object} options
 * @param {boolean} [options.collapsed=false] - Advanced sidebar collapsed state
 * @param {boolean} [options.accountForSidebar=false] - subtract sidebar from width
 * @param {number} [options.sidebarWidth=288] - w-72 when expanded
 */
export function useResponsiveDrinkGrid({
  collapsed = false,
  accountForSidebar = false,
  sidebarWidth = 288,
} = {}) {
  const [itemsPerRow, setItemsPerRow] = useState(2);
  const [rowHeight, setRowHeight] = useState(320);

  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      const availableWidth = accountForSidebar
        ? width - (collapsed ? 0 : sidebarWidth)
        : width;

      const cols = columnsForWidth(availableWidth);
      setItemsPerRow(cols);
      setRowHeight(rowHeightForColumns(cols));
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, [collapsed, accountForSidebar, sidebarWidth]);

  return { itemsPerRow, rowHeight, getGridColsClass };
}

export default useResponsiveDrinkGrid;
