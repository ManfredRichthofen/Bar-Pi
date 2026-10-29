import { GlassWater } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useLazyImage } from '@/hooks/useLazyImage';

interface PourHeroProps {
  recipeId: string | number;
  hasImage: boolean;
  name: string;
  progress: number;
  cancelled?: boolean;
}

const PourHero = ({
  recipeId,
  hasImage,
  name,
  progress,
  cancelled,
}: PourHeroProps) => {
  const reduceMotion = useReducedMotion();
  const { imageUrl, elementRef } = useLazyImage(String(recipeId), hasImage);
  const level = cancelled ? 0 : Math.min(100, Math.max(0, progress));
  const fillStyle = {
    clipPath: `inset(${100 - level}% 0 0 0)`,
    transition: reduceMotion
      ? 'none'
      : 'clip-path 700ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <figure
      ref={elementRef}
      className="relative aspect-[4/3] overflow-hidden rounded-xl border-hairline border-border bg-surface-sunken"
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover grayscale opacity-30"
          />
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 size-full object-cover"
            style={fillStyle}
          />
        </>
      ) : (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <GlassWater className="size-16 text-foreground-muted" />
          </div>
          <div
            className="absolute inset-0 bg-primary-tint"
            style={fillStyle}
            aria-hidden="true"
          />
        </>
      )}
      {level > 0 && level < 100 && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 h-px bg-foreground/60"
          style={{
            bottom: `${level}%`,
            transition: reduceMotion
              ? 'none'
              : 'bottom 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
    </figure>
  );
};

export default PourHero;
