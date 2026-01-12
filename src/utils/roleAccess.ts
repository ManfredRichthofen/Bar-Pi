export type UserRole = 'super-admin' | 'recipe-creator' | 'user';

export interface RolePermissions {
  canManageUsers: boolean;
  canManageRecipes: boolean;
  canCreateRecipes: boolean;
  canManageIngredients: boolean;
  canManageGlasses: boolean;
  canManageCategories: boolean;
  canManagePumps: boolean;
  canManageSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  'super-admin': {
    canManageUsers: true,
    canManageRecipes: true,
    canCreateRecipes: true,
    canManageIngredients: true,
    canManageGlasses: true,
    canManageCategories: true,
    canManagePumps: true,
    canManageSettings: true,
  },
  'recipe-creator': {
    canManageUsers: false,
    canManageRecipes: true,
    canCreateRecipes: true,
    canManageIngredients: true,
    canManageGlasses: false,
    canManageCategories: false,
    canManagePumps: false,
    canManageSettings: false,
  },
  'user': {
    canManageUsers: false,
    canManageRecipes: false,
    canCreateRecipes: false,
    canManageIngredients: false,
    canManageGlasses: false,
    canManageCategories: false,
    canManagePumps: false,
    canManageSettings: false,
  },
};

export const hasPermission = (
  userRole: UserRole | string | undefined,
  permission: keyof RolePermissions
): boolean => {
  if (!userRole) return false;
  
  const role = userRole as UserRole;
  const permissions = ROLE_PERMISSIONS[role];
  
  return permissions?.[permission] || false;
};

export const canAccessRoute = (
  userRole: UserRole | string | undefined,
  route: string
): boolean => {
  if (!userRole) return false;
  
  const role = userRole as UserRole;
  const permissions = ROLE_PERMISSIONS[role];
  
  switch (route) {
    case '/drinks':
    case '/favorites':
      // All authenticated users can access drinks and favorites
      return true;
    case '/users':
      return permissions.canManageUsers;
    case '/recipes':
    case '/recipes/new':
    case '/recipes/$recipeId/edit':
      return permissions.canManageRecipes;
    case '/ingredients':
      return permissions.canManageIngredients;
    case '/glasses':
      return permissions.canManageGlasses;
    case '/categories':
      return permissions.canManageCategories;
    case '/pumps':
    case '/pumps/$pumpId/edit':
      return permissions.canManagePumps;
    case '/settings':
      return permissions.canManageSettings;
    default:
      return true; // Default to allow for any other routes
  }
};

export const getRoleDisplayName = (role: UserRole | string | undefined): string => {
  if (!role) return 'Unknown Role';
  
  switch (role) {
    case 'super-admin':
      return 'Super Admin';
    case 'recipe-creator':
      return 'Recipe Creator';
    case 'user':
      return 'User';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ');
  }
};
