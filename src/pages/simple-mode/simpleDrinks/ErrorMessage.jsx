import React from 'react';
import { X, AlertCircle } from 'lucide-react';

const ErrorMessage = React.memo(({ error, onDismiss }) => (
  <div className="alert alert-error mb-3 text-sm">
    <AlertCircle className="w-4 h-4" />
    <span>{error}</span>
    <button
      className="btn btn-ghost btn-sm p-0 hover:bg-error/10"
      onClick={onDismiss}
    >
      <X className="w-4 h-4" />
    </button>
  </div>
));

export default ErrorMessage;
