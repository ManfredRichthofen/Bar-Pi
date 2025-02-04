import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import Login from './pages/login';
import Settings from './pages/settings';
import Drinks from './pages/drinks';
import MainLayout from './components/Layout';
import Ingredients from './pages/ingredients';
import Order from './pages/order';
import CreateUser from './pages/create-user';
import Glasses from './pages/glasses';

function App() {
  const reinitializeAuthState = useAuthStore(
    (state) => state.reinitializeAuthState,
  );
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    reinitializeAuthState();
  }, [reinitializeAuthState]);

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
