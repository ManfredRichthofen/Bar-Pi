import React, { useState } from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { Heart, Trash2 } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import useFavoritesStore from '../../../store/favoritesStore';

const Favorites = ({ sidebarCollapsed = false }) => {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!token) {
    return <Navigate to="/login" />;
  }

  const handleCardClick = (recipe) => {
    navigate({ to: '/order', state: { recipe } });
  };

  const handleRemoveFavorite = (e, recipeId) => {
    e.stopPropagation();
    removeFavorite(recipeId);
  };

  const handleClearAll = () => {
    clearFavorites();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">Favorites</h1>
              {favorites.length > 0 && (
                <div className="badge badge-primary">{favorites.length}</div>
              )}
            </div>
            {favorites.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm text-error"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 size={16} className="mr-2" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-base-content/40 mb-4">
                <svg
                  className="w-16 h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-labelledby="no-favorites-title"
                >
                  <title id="no-favorites-title">No favorites icon</title>
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
              <p className="text-base-content/60 text-center text-sm">
                Your favorite drinks will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
              {favorites.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => handleCardClick(recipe)}
                  className="card bg-base-100 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-95 overflow-hidden border border-base-200"
                >
                  <div className="flex flex-col h-full">
                    {/* Image section */}
                    <figure className="relative w-full aspect-[4/3] rounded-t-lg overflow-hidden bg-base-200 flex-shrink-0">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
                          <span className="text-base-content/40 text-sm font-medium">
                            No image
                          </span>
                        </div>
                      )}
                      {/* Favorite indicator */}
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveFavorite(e, recipe.id)}
                          className="btn btn-circle btn-sm bg-error/90 hover:bg-error border-none text-error-content"
                        >
                          <Heart size={16} fill="currentColor" />
                        </button>
                      </div>
                    </figure>

                    {/* Content section */}
                    <div className="flex flex-col flex-1 p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="text-base font-bold text-base-content/90 leading-tight flex-1 min-w-0 line-clamp-2">
                          {recipe.name}
                        </h3>
                        {recipe.alcoholic && (
                          <div className="badge badge-error badge-sm whitespace-nowrap shrink-0 text-xs font-semibold">
                            21+
                          </div>
                        )}
                      </div>

                      {recipe.description && (
                        <p className="text-xs text-base-content/60 line-clamp-2 mb-2">
                          {recipe.description}
                        </p>
                      )}

                      {/* Ingredients count */}
                      <div className="mt-auto pt-2">
                        <div className="text-xs text-base-content/60">
                          {recipe.ingredients?.length || 0} ingredient
                          {recipe.ingredients?.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Clear All Favorites?</h3>
            <p className="text-base-content/70 mb-6">
              Are you sure you want to remove all {favorites.length} favorite
              {favorites.length !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default Favorites;
