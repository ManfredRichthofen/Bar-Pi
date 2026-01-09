import React, { useState, useCallback } from 'react';
import useAuthStore from '@/store/authStore.js';
import { Navigate } from '@tanstack/react-router';
import VirtualDrinksGrid from './components/drinks/VirtualDrinksGrid.jsx';
import { Search } from 'lucide-react';
import debounce from 'lodash/debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Drinks = ({ sidebarCollapsed = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const token = useAuthStore((state) => state.token);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setSearchLoading(false);
    }, 500),
    [],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.search.value;
    setSearchValue(value);
    setSearchLoading(true);
    debouncedSearch(value);
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setSearchLoading(true);
    debouncedSearch(value);
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm pt-2">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Available Drinks</h1>
          </div>

          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                name="search"
                value={searchValue}
                onChange={handleSearchInput}
                placeholder="Search drinks..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <VirtualDrinksGrid
        token={token}
        searchTerm={searchTerm}
        collapsed={sidebarCollapsed}
      />
    </div>
  );
};

export default Drinks;
