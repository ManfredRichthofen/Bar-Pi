import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFavoritesStore = create(
  persist(
    (set) => ({
      favorites: [],

      toggleFavorite: (recipe) =>
        set((state) => ({
          favorites: state.favorites.some((fav) => fav.id === recipe.id)
            ? state.favorites.filter((fav) => fav.id !== recipe.id)
            : [...state.favorites, { ...recipe, favoritedAt: Date.now() }],
        })),

      removeFavorite: (recipeId) =>
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.id !== recipeId),
        })),

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'bar-pi-favorites',
    },
  ),
);

export default useFavoritesStore;
