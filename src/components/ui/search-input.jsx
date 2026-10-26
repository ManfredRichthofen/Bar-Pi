import { Loader2, Search } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SearchInput = React.memo(
  ({
    value,
    onChange,
    onSubmit,
    loading = false,
    placeholder = 'Search...',
    debounceMs = 300,
    className = '',
    inputClassName = '',
    buttonClassName = '',
    showButton = true,
    size = 'default',
    variant = 'default',
  }) => {
    // Internal state for immediate UI updates
    const [internalValue, setInternalValue] = useState(value || '');
    const timeoutRef = useRef(null);

    // Sync internal value when prop changes externally
    useEffect(() => {
      setInternalValue(value || '');
    }, [value]);

    const handleSubmit = useCallback(
      (e) => {
        e.preventDefault();
        if (onSubmit) {
          onSubmit(e);
        }
      },
      [onSubmit],
    );

    const handleInputChange = useCallback(
      (e) => {
        const newValue = e.target.value;

        // Update internal state immediately for responsive UI
        setInternalValue(newValue);

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce the callback to parent
        if (onChange) {
          timeoutRef.current = setTimeout(() => {
            onChange(newValue);
          }, debounceMs);
        }
      },
      [onChange, debounceMs],
    );

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const sizeClasses = {
      sm: 'min-h-control-sm text-base',
      default: 'min-h-control-md text-base',
      lg: 'min-h-control-lg text-lg',
    };

    const inputSizeClasses = {
      sm: 'pr-10',
      default: 'pr-14',
      lg: 'pr-14',
    };

    const buttonSizeClasses = {
      sm: 'size-5',
      default: 'size-6',
      lg: 'size-6',
    };

    const baseInputClassName = `w-full ${sizeClasses[size]} ${inputSizeClasses[size]} ${inputClassName}`;
    const baseButtonClassName = `absolute right-2 top-1/2 -translate-y-1/2 ${buttonClassName}`;

    return (
      <form onSubmit={handleSubmit} className={`w-full ${className}`}>
        <div className="relative">
          <Input
            name="search"
            value={internalValue}
            className={baseInputClassName}
            placeholder={placeholder}
            onChange={handleInputChange}
            variant={variant}
          />
          {showButton && (
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className={baseButtonClassName}
            >
              {loading ? (
                <Loader2
                  className={`${buttonSizeClasses[size]} animate-spin`}
                />
              ) : (
                <Search className={buttonSizeClasses[size]} />
              )}
            </Button>
          )}
        </div>
      </form>
    );
  },
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
