import { createFileRoute } from '@tanstack/react-router';
import Favorites from '../pages/AdvancedMode/FavoritesPage/favorites';

export const Route = createFileRoute('/_advanced/favorites')({
  component: Favorites,
});
