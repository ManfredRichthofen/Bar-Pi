import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import { create } from 'zustand';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';

// Advanced Mode
import Login from './pages/login';
import Settings from './pages/settings';
import Drinks from './pages/drinks';
import MainLayout from './components/Layout';
import Ingredients from './pages/ingredients';
import Order from './pages/order';
import CreateUser from './pages/user';
import Glasses from './pages/glasses';
import Pumps from './pages/pumps';

//Simple Mode
import SimpleLayout from './components/simple-mode/simpleLayout';
import SimpleDrinks from './pages/simple-mode/simpleDrinks';
import SimpleSettings from './pages/simple-mode/simpleSettings';
import SimpleOrder from './pages/simple-mode/simpleOrder';
import SimpleOrderStatus from './pages/simple-mode/simpleOrderStatus';


interface UIModeState {
  isAdvancedMode: boolean;
  setAdvancedMode: (isAdvanced: boolean) => void;
}


const useUIModeStore = create<UIModeState>((set) => ({
  isAdvancedMode: localStorage.getItem('uiMode') === 'advanced',
  setAdvancedMode: (isAdvanced: boolean) => {
    localStorage.setItem('uiMode', isAdvanced ? 'advanced' : 'simple');
    set({ isAdvancedMode: isAdvanced });
  },
}));

function App() {
  const reinitializeAuthState = useAuthStore(
    (state) => state.reinitializeAuthState,
  );
  const token = useAuthStore((state) => state.token);
  const { i18n } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  const isAdvancedMode = useUIModeStore((state) => state.isAdvancedMode);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);

  // Auth
  useEffect(() => {
    const initialize = async () => {
      await reinitializeAuthState();
      setIsInitialized(true);
    };
    initialize();
  }, [reinitializeAuthState]);

  // Theme and language
  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeChange(false);

    // Language initialization
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en-US';
    i18n.changeLanguage(savedLanguage);

    // Theme observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          if (newTheme) {
            localStorage.setItem('theme', newTheme);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [i18n]);

  // Show nothing while initializing to prevent flash of incorrect content
  if (!isInitialized) {
    return null;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            !token ? (
              <Login />
            ) : (
              <Navigate
                to={isAdvancedMode ? '/drinks' : '/simple/drinks'}
                replace
              />
            )
          }
        />

        {/* Simple Mode routes */}
        <Route
          path="/simple/*"
          element={
            token ? (
              <SimpleLayout>
                <Routes>
                  <Route path="/drinks" element={<SimpleDrinks />} />
                  <Route
                    path="/settings"
                    element={<SimpleSettings onModeChange={setAdvancedMode} />}
                  />
                  <Route path="/order" element={<SimpleOrder />} />
                  <Route path="/order-status" element={<SimpleOrderStatus />} />
                  <Route
                    path="*"
                    element={<Navigate to="/simple/drinks" replace />}
                  />
                </Routes>
              </SimpleLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Main app routes */}
        <Route
          path="/*"
          element={
            token ? (
              <MainLayout>
                <Routes>
                  <Route path="/drinks" element={<Drinks />} />
                  <Route path="/ingredients" element={<Ingredients />} />
                  <Route path="/order" element={<Order />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/users" element={<CreateUser />} />
                  <Route path="/glasses" element={<Glasses />} />
                  <Route path="/pumps" element={<Pumps />} />
                  <Route path="*" element={<Navigate to="/drinks" replace />} />
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Root redirect based on mode preference */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAdvancedMode ? '/drinks' : '/simple/drinks'}
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
