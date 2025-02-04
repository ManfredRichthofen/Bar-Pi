import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import Login from './pages/login';
import Settings from './pages/settings';
import Drinks from './pages/drinks';
import MainLayout from './components/Layout';
import Ingredients from './pages/ingredients';
import Order from './pages/order';
import CreateUser from './pages/user';
import Glasses from './pages/glasses';
import Pumps from './pages/pumps';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';

function App() {
  const reinitializeAuthState = useAuthStore(
    (state) => state.reinitializeAuthState,
  );
  const token = useAuthStore((state) => state.token);
  const { i18n } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Auth initialization
  useEffect(() => {
    const initialize = async () => {
      await reinitializeAuthState();
      setIsInitialized(true);
    };
    initialize();
  }, [reinitializeAuthState]);

  // Theme and language initialization
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
      attributeFilter: ['data-theme']
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
          element={!token ? <Login /> : <Navigate to="/drinks" replace />}
        />

        {/* Protected routes with layout */}
        <Route
          path="/*"
          element={
            token ? (
              <MainLayout>
                <Routes>
                  <Route path="/drinks" element={<Drinks />} />
                  <Route path="/" element={<Navigate to="/drinks" replace />} />
                  <Route path="/ingredients" element={<Ingredients />} />
                  <Route path="/order" element={<Order />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/users" element={<CreateUser />} />
                  <Route path="/glasses" element={<Glasses />} />
                  <Route path="/pumps" element={<Pumps />} />
                  {/* Add more routes here */}
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
