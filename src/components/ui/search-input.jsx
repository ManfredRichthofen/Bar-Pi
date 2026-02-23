import { Loader2, Search } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
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
    // Debounced onChange handler
    const debouncedOnChange = useMemo(() => {
      if (!onChange) return undefined;

      let timeoutId;
      return (e) => {
        const newValue = e.target.value;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      };
    }, [onChange, debounceMs]);

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
        if (debouncedOnChange) {
          debouncedOnChange(e);
        }
      },
      [debouncedOnChange],
    );

    const sizeClasses = {
      sm: 'h-9 text-sm',
      default: 'h-12 text-base',
      lg: 'h-14 text-lg',
    };

    const inputSizeClasses = {
      sm: 'pr-10',
      default: 'pr-12',
      lg: 'pr-14',
    };

    const buttonSizeClasses = {
      sm: 'w-4 h-4',
      default: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const baseInputClassName = `w-full ${sizeClasses[size]} ${inputSizeClasses[size]} ${inputClassName}`;
    const baseButtonClassName = `absolute right-2 top-1/2 -translate-y-1/2 ${buttonClassName}`;

    return (
      <form onSubmit={handleSubmit} className={`w-full ${className}`}>
        <div className="relative">
          <Input
            name="search"
            value={value}
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
