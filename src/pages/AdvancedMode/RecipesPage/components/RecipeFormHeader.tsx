import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';

interface RecipeFormHeaderProps {
  title: string;
}

export const RecipeFormHeader: React.FC<RecipeFormHeaderProps> = ({
  title,
}) => {
  const navigate = useNavigate({ from: '/recipes' });

  return (
    <div className="sticky top-16 z-40 border-b-hairline border-border bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-9 sm:w-10 shrink-0"
            onClick={() => navigate({ to: '/recipes' })}
          >
            <ArrowLeft className="size-6" />
          </Button>
          <h1 className="text-lg sm:text-2xl font-bold truncate">{title}</h1>
        </div>
      </div>
    </div>
  );
};
