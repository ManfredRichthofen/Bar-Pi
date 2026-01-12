import type React from 'react';
import { useEffect, useState } from 'react';
import { User, LogOut, Settings, Smartphone, Menu } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore.ts';
import { useNavigate } from '@tanstack/react-router';
import userService from '../services/user.service';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getRoleDisplayName } from '../utils/roleAccess';

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
        toast.error('Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate, logoutUser]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out successfully');
      navigate({ to: '/login', replace: true });
    } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);
    }
  };

  const handleSimpleModeSwitch = () => {
    setAdvancedMode(false);
    navigate({ to: '/simple/drinks', replace: true });
  };

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-background border-b z-50">
      <div className="flex items-center justify-between h-full px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={20} />
          </Button>

          <h1
            className={`text-lg sm:text-xl font-semibold ${!collapsed && 'lg:hidden'}`}
          >
            BarPi
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="ghost"
                  className="flex items-center gap-2 px-2 sm:px-3"
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold m-0">
                      {loading ? 'Loading...' : userData?.username || 'Guest'}
                    </p>
                    <p className="text-xs text-muted-foreground m-0">
                      {loading ? '' : getRoleDisplayName(userData?.role)}
                    </p>
                  </div>
                </Button>
              )}
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate({ to: '/settings' })}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSimpleModeSwitch}>
                <Smartphone className="mr-2 h-4 w-4" />
                <span>Simple Mode</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
