import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Creates a standardized Zustand store with persistence
 * @param {string} name - Storage name for persistence
 * @param {object} initialState - Initial state object
 * @param {function} actions - Actions function (set, get) => ({ ...actions })
 * @param {object} options - Additional persist options
 * @returns {Function} Zustand store hook
 */
export const createPersistedStore = (name, initialState, actions, options = {}) => {
  return create()(
    persist(
      (set, get) => ({
        // Standard state
        loading: false,
        error: null,
        ...initialState,
        
        // Standard actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        // Custom actions
        ...actions(set, get)
      }),
      {
        name: `${name}-storage`,
        ...options
      }
    )
  );
};

/**
 * Creates a non-persisted Zustand store (for session data)
 * @param {object} initialState - Initial state object
 * @param {function} actions - Actions function (set, get) => ({ ...actions })
 * @returns {Function} Zustand store hook
 */
export const createSessionStore = (initialState, actions) => {
  return create((set, get) => ({
    // Standard state
    loading: false,
    error: null,
    ...initialState,
    
    // Standard actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    
    // Custom actions
    ...actions(set, get)
  }));
};

/**
 * Standard store actions that can be reused
 */
export const standardActions = {
  // Reset to initial state
  reset: (initialState) => set => set(initialState),
  
  // Update multiple properties
  updateMany: (updates) => set => set(updates),
  
  // Async wrapper for loading states
  withLoading: async (action, set) => {
    set({ loading: true, error: null });
    try {
      const result = await action();
      set({ loading: false, error: null });
      return result;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  }
};

export default {
  createPersistedStore,
  createSessionStore,
  standardActions
};
