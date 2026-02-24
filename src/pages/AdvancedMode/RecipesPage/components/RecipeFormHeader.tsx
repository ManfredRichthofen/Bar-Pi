import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';

interface RecipeFormHeaderProps {
  title: string;
  onSave: () => void;
  saving?: boolean;
  saveText?: string;
}

export const RecipeFormHeader: React.FC<RecipeFormHeaderProps> = ({
  title,
  onSave,
  saving = false,
  saveText = 'Save',
}) => {
  const navigate = useNavigate({ from: '/recipes' });

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 sm:h-10 sm:w-10 p-0 shrink-0"
              onClick={() => navigate({ to: '/recipes' })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold truncate">{title}</h1>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-12 sm:h-10 text-base sm:text-sm"
              onClick={() => navigate({ to: '/recipes' })}
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
              className="flex-1 sm:flex-none h-12 sm:h-10 text-base sm:text-sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
