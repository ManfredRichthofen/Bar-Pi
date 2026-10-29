import { useNavigate } from '@tanstack/react-router';
import {
  ChevronDown,
  GlassWater,
  LogOut,
  Menu,
  Settings,
  Smartphone,
  User,
} from 'lucide-react';
import type React from 'react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '../hooks/useCurrentUser';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore.ts';
import { getRoleDisplayName, mapAdminLevelToRole } from '../utils/roleAccess';

interface HeaderBarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ collapsed, onToggle }) => {
  const { user: userData, loading } = useCurrentUser({ logoutOn401: true });
  const logoutUser = useAuthStore((s) => s.logoutUser);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);
  const navigate = useNavigate();

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

  const username = loading ? '' : userData?.username || 'Guest';
  const role = loading
    ? ''
    : getRoleDisplayName(mapAdminLevelToRole(userData?.adminLevel));

  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-16 border-b-hairline border-border bg-background">
      <div className="flex h-full items-center justify-between gap-4 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu />
          </Button>

          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GlassWater className="size-6" />
            </span>
            <span className="text-xl font-bold tracking-tight">Bar-Pi</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                variant="ghost"
                className="gap-3 pr-3 pl-2"
                aria-label="Account menu"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground uppercase">
                  {username.slice(0, 1) || <User className="size-6" />}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-base leading-5 font-semibold">
                    {loading ? 'Loading…' : username}
                  </span>
                  <span className="block text-sm leading-4 font-normal text-foreground-muted">
                    {role}
                  </span>
                </span>
                <ChevronDown className="hidden size-5 text-foreground-muted sm:block" />
              </Button>
            )}
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate({ to: '/settings' })}>
              <Settings />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSimpleModeSwitch}>
              <Smartphone />
              <span>Simple mode</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default HeaderBar;
