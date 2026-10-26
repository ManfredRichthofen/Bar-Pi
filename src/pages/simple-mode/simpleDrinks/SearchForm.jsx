import { Loader2, Search } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SearchForm = React.memo(({ onSubmit, onInput, loading, value }) => (
  <form onSubmit={onSubmit} className="w-full">
    <div className="relative">
      <Input
        name="search"
        value={value}
        className="w-full text-base pr-12"
        placeholder="Search drinks..."
        onChange={onInput}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2"
      >
        {loading ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <Search className="size-6" />
        )}
      </Button>
    </div>
  </form>
));

export default SearchForm;
