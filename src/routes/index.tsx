import { RootRoute, Route, Router, redirect } from '@tanstack/react-router'
import { lazy } from 'react'
import useAuthStore from '../store/authStore'
import useUIModeStore from '../store/uiModeStore'
import NotFound from '../components/NotFound'
import Root from './__root'

// Create root route
const rootRoute = new RootRoute({
  component: Root,
  beforeLoad: async () => {
    const { isInitialized } = useUIModeStore.getState()
    
    // Don't redirect until initialization is complete
    if (!isInitialized) {
      return
    }

    const token = useAuthStore.getState().token
    const isAdvancedMode = useUIModeStore.getState().isAdvancedMode

    // Only check token if we're not on the login page
    if (!token && window.location.pathname !== '/login') {
      throw redirect({
        to: '/login'
      })
    }

    // Only redirect from root path
    if (window.location.pathname === '/') {
      throw redirect({
        to: isAdvancedMode ? '/advanced/drinks' : '/simple/drinks'
      })
    }
  }
})

// Create index route
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null,
})

// Create routes
const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: lazy(() => import('../pages/login.jsx')),
  beforeLoad: async () => {
    const { isInitialized } = useUIModeStore.getState()
    
    // Don't redirect until initialization is complete
    if (!isInitialized) {
      return
    }

    const token = useAuthStore.getState().token
    const isAdvancedMode = useUIModeStore.getState().isAdvancedMode

    if (token) {
      throw redirect({
        to: isAdvancedMode ? '/advanced/drinks' : '/simple/drinks'
      })
    }
  },
})

// Advanced mode routes
const advancedLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/advanced',
  component: lazy(() => import('../components/Layout')),
  beforeLoad: async () => {
    const { isInitialized } = useUIModeStore.getState()
    
    // Don't redirect until initialization is complete
    if (!isInitialized) {
      return
    }

    const token = useAuthStore.getState().token
    const isAdvancedMode = useUIModeStore.getState().isAdvancedMode

    if (!token) {
      throw redirect({
        to: '/login'
      })
    }

    if (!isAdvancedMode) {
      throw redirect({
        to: '/simple/drinks'
      })
    }
  },
})

const advancedDrinksRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/drinks',
  component: lazy(() => import('../pages/drinks.jsx')),
})

const advancedFavoritesRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/favorites',
  component: lazy(() => import('../pages/favorites.jsx')),
})

const advancedRecipesRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/recipes',
  component: lazy(() => import('../pages/recipes.jsx')),
})

const advancedCategoriesRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/categories',
  component: lazy(() => import('../pages/categories.tsx')),
})

const advancedIngredientsRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/ingredients',
  component: lazy(() => import('../pages/ingredients.jsx')),
})

const advancedOrderRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/order',
  component: lazy(() => import('../pages/order.jsx')),
})

const advancedSettingsRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/settings',
  component: lazy(() => import('../pages/settings.jsx')),
})

const advancedUsersRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/users',
  component: lazy(() => import('../pages/user.jsx')),
})

const advancedGlassesRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/glasses',
  component: lazy(() => import('../pages/glasses.jsx')),
})

const advancedPumpsRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/pumps',
  component: lazy(() => import('../pages/pumps.jsx')),
})

const advancedProfileRoute = new Route({
  getParentRoute: () => advancedLayoutRoute,
  path: '/profile',
  component: lazy(() => import('../pages/profile.jsx')),
})

// Simple mode routes
const simpleLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/simple',
  component: lazy(() => import('../components/simple-mode/simpleLayout')),
  beforeLoad: async () => {
    const token = useAuthStore.getState().token
    const isAdvancedMode = useUIModeStore.getState().isAdvancedMode

    if (!token) {
      throw redirect({
        to: '/login'
      })
    }

    if (isAdvancedMode) {
      throw redirect({
        to: '/advanced/drinks'
      })
    }
  },
})

const simpleDrinksRoute = new Route({
  getParentRoute: () => simpleLayoutRoute,
  path: '/drinks',
  component: lazy(() => import('../pages/simple-mode/simpleDrinks.jsx')),
})

const simpleSettingsRoute = new Route({
  getParentRoute: () => simpleLayoutRoute,
  path: '/settings',
  component: lazy(() => import('../pages/simple-mode/simpleSettings.jsx')),
})

const simpleOrderRoute = new Route({
  getParentRoute: () => simpleLayoutRoute,
  path: '/order',
  component: lazy(() => import('../pages/simple-mode/simpleOrder.jsx')),
})

const simpleOrderStatusRoute = new Route({
  getParentRoute: () => simpleLayoutRoute,
  path: '/order-status',
  component: lazy(() => import('../pages/simple-mode/simpleOrderStatus.jsx')),
})

// Create catch-all route
const catchAllRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFound,
})

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  advancedLayoutRoute.addChildren([
    advancedDrinksRoute,
    advancedFavoritesRoute,
    advancedRecipesRoute,
    advancedCategoriesRoute,
    advancedIngredientsRoute,
    advancedOrderRoute,
    advancedSettingsRoute,
    advancedUsersRoute,
    advancedGlassesRoute,
    advancedPumpsRoute,
    advancedProfileRoute,
  ]),
  simpleLayoutRoute.addChildren([
    simpleDrinksRoute,
    simpleSettingsRoute,
    simpleOrderRoute,
    simpleOrderStatusRoute,
  ]),
  catchAllRoute,
])

// Create router
export const router = new Router({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 