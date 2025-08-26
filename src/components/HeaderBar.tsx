import React, { useEffect, useState } from 'react';
import { User, LogOut, Settings, Smartphone, Menu } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore.ts';
import { useNavigate } from '@tanstack/react-router';
import userService from '../services/user.service';

interface HeaderBarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface UserData {
  username: string;
  role: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ collapsed, onToggle }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, logoutUser } = useAuthStore();
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        const data = await userService.getMe(headers);
        setUserData(data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        if (
          error instanceof Error &&
          'response' in error &&
          typeof error.response === 'object' &&
          error.response &&
          'status' in error.response &&
          error.response.status === 401
        ) {
          logoutUser();
          navigate({ to: '/login', replace: true });
        }
        const toastElement = document.createElement('div');
        toastElement.className = 'toast toast-top toast-end';
        toastElement.innerHTML = `
          <div class="alert alert-error">
            <span>Failed to load user information</span>
          </div>
        `;
        document.body.appendChild(toastElement);
        setTimeout(() => toastElement.remove(), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate, logoutUser]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      const toastElement = document.createElement('div');
      toastElement.className = 'toast toast-top toast-end';
      toastElement.innerHTML = `
        <div class="alert alert-success">
          <span>Logged out successfully</span>
        </div>
      `;
      document.body.appendChild(toastElement);
      setTimeout(() => toastElement.remove(), 3000);
      navigate({ to: '/login', replace: true });
    } catch (error) {
      const toastElement = document.createElement('div');
      toastElement.className = 'toast toast-top toast-end';
      toastElement.innerHTML = `
        <div class="alert alert-error">
          <span>Failed to logout</span>
        </div>
      `;
      document.body.appendChild(toastElement);
      setTimeout(() => toastElement.remove(), 3000);
      console.error('Logout error:', error);
    }
  };

  const handleSimpleModeSwitch = () => {
    setAdvancedMode(false);
    navigate({ to: '/simple/drinks', replace: true });
  };

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-base-100 border-b border-base-200 z-50">
      <div className="flex items-center justify-between h-full px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onToggle}
            className="btn btn-ghost btn-sm btn-square"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={20} className="text-base-content/70" />
          </button>

          <h1
            className={`text-lg sm:text-xl font-semibold ${!collapsed && 'lg:hidden'}`}
          >
            What to name it
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="flex items-center gap-2 px-2 sm:px-3 py-2"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <User size={20} className="text-base-content/70" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-base-content m-0">
                  {loading ? 'Loading...' : userData?.username || 'Guest'}
                </p>
                <p className="text-xs text-base-content/70 m-0">
                  {loading ? '' : userData?.role || 'Unknown Role'}
                </p>
              </div>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2"
            >
              <li>
                <a
                  onClick={() => navigate({ to: '/profile' })}
                  className="flex items-center gap-2 py-2"
                >
                  <User size={16} />
                  <span className="text-sm">Profile</span>
                </a>
              </li>
              <li>
                <a
                  onClick={() => navigate({ to: '/settings' })}
                  className="flex items-center gap-2 py-2"
                >
                  <Settings size={16} />
                  <span className="text-sm">Settings</span>
                </a>
              </li>
              <li>
                <a
                  onClick={handleSimpleModeSwitch}
                  className="flex items-center gap-2 py-2"
                >
                  <Smartphone size={16} />
                  <span className="text-sm">Simple Mode</span>
                </a>
              </li>
              <div className="divider my-1"></div>
              <li>
                <a
                  onClick={handleLogout}
                  className="text-error flex items-center gap-2 py-2"
                >
                  <LogOut size={16} />
                  <span className="text-sm">Logout</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
