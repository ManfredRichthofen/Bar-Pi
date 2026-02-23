// Type declarations for Zustand stores
declare const useAuthStore: {
  getState: () => {
    token: string | null;
    user: any;
    error: string | null;
    loading: boolean;
  };
};

declare const useUIModeStore: {
  getState: () => {
    isAdvancedMode: boolean;
    isInitialized: boolean;
  };
};

export {};
