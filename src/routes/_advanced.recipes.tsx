import {
  createFileRoute,
  Outlet,
  redirect,
  useMatches,
} from '@tanstack/react-router';
import Recipes from '../pages/AdvancedMode/RecipesPage/recipes';
import userService from '../services/user.service';
import useAuthStore from '../store/authStore';
import { hasPermission, mapAdminLevelToRole } from '../utils/roleAccess';

export const Route = createFileRoute('/_advanced/recipes')({
  component: AdvancedRecipesRoute,
  beforeLoad: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: '/login' });
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const userData = await userService.getMe(headers);
      const role = mapAdminLevelToRole(userData.adminLevel);

      if (!hasPermission(role, 'canManageRecipes')) {
        throw redirect({ to: '/drinks' });
      }
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const response = error.response as any;
        if (response?.status === 401) {
          throw redirect({ to: '/login' });
        }
      }
      throw redirect({ to: '/drinks' });
    }
  },
});

function AdvancedRecipesRoute() {
  const matches = useMatches();
  const isChildRoute = matches.some(
    (match) =>
      match.id.includes('/new') || match.id.includes('/$recipeId/edit'),
  );

  // If we're on a child route (like new or edit), show the Outlet
  // Otherwise show the recipes list page
  if (isChildRoute) {
    return <Outlet />;
  }

  return <Recipes />;
}
