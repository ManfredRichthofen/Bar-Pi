import React, { useEffect, useState } from 'react';
import {
  GlassWater,
  Heart,
  Settings,
  ArrowLeftToLine,
  BookText,
  Users,
  Gauge,
  Martini,
  FlaskConical,
  Tag,
} from 'lucide-react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { canAccessRoute, mapAdminLevelToRole } from '../utils/roleAccess';
import useAuthStore from '../store/authStore';
import userService from '../services/user.service';

interface UserData {
  id: number;
  username: string;
  adminLevel: number;
  accountNonLocked: boolean;
}

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
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
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const menuItems = [
    {
      group: 'Main',
      items: [
        {
          key: '/drinks',
          icon: <Martini size={16} />,
          label: 'Drinks',
        },
        {
          key: '/favorites',
          icon: <Heart size={16} />,
          label: 'Favorites',
        },
      ],
    },
    {
      group: 'Configuration',
      items: [
        {
          key: '/recipes',
          icon: <FlaskConical size={16} />,
          label: 'Recipes',
        },
        {
          key: '/ingredients',
          icon: <BookText size={16} />,
          label: 'Ingredients',
        },
        {
          key: '/glasses',
          icon: <GlassWater size={16} />,
          label: 'Glasses',
        },
      ],
    },
    {
      group: 'Administration',
      items: [
        {
          key: '/users',
          icon: <Users size={16} />,
          label: 'Users',
        },
        {
          key: '/settings',
          icon: <Settings size={16} />,
          label: 'Settings',
        },
        {
          key: '/categories',
          icon: <Tag size={16} />,
          label: 'Categories',
        },
        {
          key: '/pumps',
          icon: <Gauge size={16} />,
          label: 'Pumps',
        },
      ],
    },
  ];

  // Remove the body scroll effect since we don't want to prevent page scrolling
  useEffect(() => {
    // Only prevent scroll on the backdrop element
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) {
      backdrop.addEventListener('touchmove', (e) => e.preventDefault());
    }
  }, [collapsed]);

  return (
    <>
      {/* Backdrop only shows on mobile */}
      {!collapsed && (
        <div
          className="sidebar-backdrop fixed inset-0 bg-black/30 sm:hidden z-10"
          onClick={() => onCollapse(true)}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] transition-all duration-300 z-20 
          ${collapsed ? 'w-0 -translate-x-full' : 'w-[280px] sm:w-72 translate-x-0'}`}
      >
        <div
          className={`transition-all duration-300 h-full flex flex-col bg-background relative border-r border-border shadow-sm
            ${collapsed ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="h-14 flex-none flex items-center justify-between px-4 sm:px-6 transition-colors duration-300 bg-muted/30 border-b border-border">
            <span className="text-base font-semibold">Menu</span>
            <button
              onClick={() => onCollapse(true)}
              className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ArrowLeftToLine size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <nav className="p-3 sm:p-4 space-y-6">
              {menuItems.map((group) => {
                const accessibleItems = group.items.filter((item) => {
                  if (loading || !userData) {
                    return item.key === '/drinks' || item.key === '/favorites';
                  }
                  
                  if (item.key === '/drinks' || item.key === '/favorites') {
                    return true;
                  }
                  
                  const role = mapAdminLevelToRole(userData.adminLevel);
                  return canAccessRoute(role, item.key);
                });

                // Only show the section if there are accessible items
                if (accessibleItems.length === 0) {
                  return null;
                }

                return (
                  <div key={group.group}>
                    <h2 className="text-xs font-semibold tracking-wider text-muted-foreground px-2 mb-2 uppercase">
                      {group.group}
                    </h2>
                    <div className="space-y-1">
                      {accessibleItems.map((item) => (
                        <button
                          key={item.key}
                          className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 text-left
                            ${
                              location.pathname === item.key
                                ? 'bg-primary/10 text-primary hover:bg-primary/15 font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }
                            active:scale-[0.98]`}
                          onClick={() => {
                            navigate({ to: item.key });
                            if (window.innerWidth < 640) {
                              onCollapse(true);
                            }
                          }}
                        >
                          {React.cloneElement(item.icon, {
                            size: 18,
                            strokeWidth: 2,
                            className: `transition-colors duration-200 ${
                              location.pathname === item.key ? 'text-primary' : ''
                            }`,
                          })}
                          <span className="text-sm whitespace-nowrap">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
