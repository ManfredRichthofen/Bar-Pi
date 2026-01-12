import { Info, Loader2 } from 'lucide-react';
import { useLazyImage } from '@/hooks/useLazyImage';

interface DrinkImageProps {
  recipeId: string;
  hasImage: boolean;
  name: string;
}

const DrinkImage = ({ recipeId, hasImage, name }: DrinkImageProps) => {
  const { imageUrl, loading, error, elementRef } = useLazyImage(
    recipeId,
    hasImage,
  );

  return (
    <figure
      ref={elementRef}
      className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm sm:shadow-lg bg-base-200"
    >
      {loading ? (
        <div className="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-base-content/40 animate-spin" />
        </div>
      ) : imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
          <div className="text-center p-4">
            <Info className="w-10 h-10 sm:w-12 sm:h-12 text-base-content/40 mx-auto mb-2" />
            <span className="text-base-content/60 font-medium text-sm sm:text-base">
              {error ? 'Failed to load image' : 'No image available'}
            </span>
          </div>
        </div>
      )}
    </figure>
  );
};

export default DrinkImage;
