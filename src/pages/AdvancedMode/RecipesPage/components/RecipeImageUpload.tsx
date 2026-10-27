import { Image as ImageIcon, X } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';

interface RecipeImageUploadProps {
  imagePreview: string | null;
  onImageChange: (file: File) => void;
  onRemoveImage: () => void;
  showRemoveToggle?: boolean;
  removeImage?: boolean;
  onToggleRemoveImage?: (checked: boolean) => void;
}

export const RecipeImageUpload: React.FC<RecipeImageUploadProps> = ({
  imagePreview,
  onImageChange,
  onRemoveImage,
  showRemoveToggle = false,
  removeImage = false,
  onToggleRemoveImage,
}) => {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
        {imagePreview && !removeImage ? (
          <div className="relative w-full max-w-[220px] sm:w-40 sm:h-40 aspect-square rounded-lg overflow-hidden shadow-sm border-2 border-border">
            <img
              src={imagePreview}
              alt="Recipe preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-3 -right-3"
              onClick={onRemoveImage}
            >
              <X className="size-6" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full max-w-[220px] sm:w-40 sm:h-40 aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-primary-tint hover:border-primary transition-colors">
            <div className="flex flex-col items-center justify-center p-4">
              <ImageIcon size={32} className="mb-2 text-foreground-muted" />
              <p className="text-sm text-center text-foreground-muted leading-5">
                <span className="font-semibold">Click to upload</span>
                <br />
                PNG, JPG (max 5MB)
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
              disabled={removeImage}
            />
          </label>
        )}

        {showRemoveToggle && !imagePreview && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              className="size-6"
              checked={removeImage}
              onChange={(e) => onToggleRemoveImage?.(e.target.checked)}
            />
            <span className="text-sm">Remove existing image</span>
          </div>
        )}
      </div>
    </div>
  );
};
