import React from 'react';
import { Search } from 'lucide-react';

const SearchForm = React.memo(({ onSubmit, onInput, loading, value }) => (
  <form onSubmit={onSubmit} className="w-full">
    <div className="relative">
      <input
        name="search"
        value={value}
        className="input h-12 w-full border-2 border-base-300 text-base bg-base-200 focus:bg-base-100 transition-colors placeholder:text-base-content/50 pr-12"
        placeholder="Search drinks..."
        onChange={onInput}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm p-2 hover:bg-base-300 rounded-lg"
      >
        {loading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <Search className="w-5 h-5" />
        )}
      </button>
    </div>
  </form>
));

export default SearchForm;
