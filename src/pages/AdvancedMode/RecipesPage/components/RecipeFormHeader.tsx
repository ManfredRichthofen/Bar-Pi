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
    <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/recipes' })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/recipes' })}
            >
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving}>
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
