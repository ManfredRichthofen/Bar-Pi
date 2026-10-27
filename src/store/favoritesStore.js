import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (recipe) =>
        set((state) => {
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

      removeFavorite: (recipeId) =>
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.id !== recipeId),
        })),

      toggleFavorite: (recipe) => {
        const { favorites } = get();
        const isFavorite = favorites.some((fav) => fav.id === recipe.id);

        if (isFavorite) {
          get().removeFavorite(recipe.id);
        } else {
          get().addFavorite(recipe);
        }
      },

      isFavorite: (recipeId) => {
        const { favorites } = get();
        return favorites.some((fav) => fav.id === recipeId);
      },

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'bar-pi-favorites',
    },
  ),
);

export default useFavoritesStore;
