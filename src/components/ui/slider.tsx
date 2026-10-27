import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      className="data-horizontal:w-full data-vertical:h-full"
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control
        className={cn(
          'data-vertical:min-h-40 relative flex w-full touch-none items-center select-none data-disabled:opacity-45 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col',
          className,
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="bg-surface-sunken shadow-inset rounded-full data-horizontal:h-2.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-2.5 relative overflow-hidden select-none"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="block size-7 shrink-0 select-none rounded-full border-2 border-primary bg-surface shadow-sm transition-shadow active:shadow-pressed disabled:pointer-events-none disabled:opacity-45"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
