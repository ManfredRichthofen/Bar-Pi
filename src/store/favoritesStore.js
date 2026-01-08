import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],

      // Add a recipe to favorites
      addFavorite: (recipe) =>
        set((state) => {
          // Check if already exists
          if (state.favorites.some((fav) => fav.id === recipe.id)) {
            return state;
          }
          return {
            favorites: [
              ...state.favorites,
              { ...recipe, favoritedAt: Date.now() },
            ],
          };
        }),

      // Remove a recipe from favorites
      removeFavorite: (recipeId) =>
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.id !== recipeId),
        })),

      // Toggle favorite status
      toggleFavorite: (recipe) => {
        const { favorites } = get();
        const isFavorite = favorites.some((fav) => fav.id === recipe.id);

        if (isFavorite) {
          get().removeFavorite(recipe.id);
        } else {
          get().addFavorite(recipe);
        }
      },

      // Check if a recipe is favorited
      isFavorite: (recipeId) => {
        const { favorites } = get();
        return favorites.some((fav) => fav.id === recipeId);
      },

      // Clear all favorites
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'bar-pi-favorites',
    },
  ),
);

export default useFavoritesStore;
