import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import RecipeService from '../services/recipe.service.js';
import { Navigate } from '@tanstack/react-router';
import DrinkCard from '../components/drinks/DrinkCard.jsx';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Search } from 'lucide-react';

const Drinks = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const token = useAuthStore((state) => state.token);

  const fetchRecipes = async (pageNumber, search = '') => {
    if (!token) {
      console.log('No token available');
      return;
    }

    setLoading(true);
    try {
      const response = await RecipeService.getRecipes(
        pageNumber, // page
        null, // ownerId
        null, // inCollection
        null, // fabricable
        null, // containsIngredients
        search, // searchName
        null, // inCategoryId
        null, // orderBy
        token, // token
      );

      if (response && response.content) {
        if (pageNumber === 0) {
          setRecipes(response.content);
        } else {
          setRecipes((prev) => [...prev, ...response.content]);
        }
        setHasMore(!response.last);
      } else {
        console.log('Invalid response format:', response);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError(error.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(0);
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.search.value;
    setSearchTerm(value);
    setPage(0);
    setRecipes([]);
    fetchRecipes(0, value);
  };

  const loadMoreData = () => {
    if (loading || !hasMore) {
      return;
    }
    setPage((prev) => {
      const nextPage = prev + 1;
      fetchRecipes(nextPage, searchTerm);
      return nextPage;
    });
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-20 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Available Drinks
        </h2>

        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
          <div className="join w-full">
            <input
              name="search"
              className="input join-item w-full"
              placeholder="Search drinks..."
            />
            <button type="submit" className="btn bg-base-100 join-item">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>

      <InfiniteScroll
        dataLength={recipes.length}
        next={loadMoreData}
        hasMore={hasMore}
        loader={
          <div className="text-center py-4">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        }
        endMessage={
          <div className="text-center py-6 text-base-content/60">
            {recipes.length === 0
              ? 'No drinks found'
              : 'No more drinks to load'}
          </div>
        }
        scrollThreshold="90%"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recipes.map((recipe) => (
            <DrinkCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default Drinks;
