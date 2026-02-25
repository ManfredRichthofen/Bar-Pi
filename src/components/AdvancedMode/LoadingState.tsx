import { Loader2 } from 'lucide-react';
import type React from 'react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  fullScreen = false,
  className = '',
}) => {
  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50 ${className}`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin" />
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center py-12 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
};
