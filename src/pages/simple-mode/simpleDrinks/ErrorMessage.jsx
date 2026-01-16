import { AlertCircle, X } from 'lucide-react';
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const ErrorMessage = React.memo(({ error, onDismiss }) => (
  <Alert variant="destructive" className="mb-3">
    <AlertCircle className="w-4 h-4" />
    <AlertDescription className="flex items-center justify-between">
      <span className="text-sm">{error}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 hover:bg-destructive/10"
        onClick={onDismiss}
      >
        <X className="w-4 h-4" />
      </Button>
    </AlertDescription>
  </Alert>
));

export default ErrorMessage;
