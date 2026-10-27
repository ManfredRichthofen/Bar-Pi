import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftToLine,
  BarChart3,
  BookText,
  FlaskConical,
  Gauge,
  GlassWater,
  Heart,
  Martini,
  Settings,
  Tag,
  Users,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { canAccessRoute, mapAdminLevelToRole } from '../utils/roleAccess';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: userData, loading } = useCurrentUser();

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
        {
          key: '/statistics',
          icon: <BarChart3 size={16} />,
          label: 'Statistics',
        },
      ],
    },
  ];

  useEffect(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) {
      backdrop.addEventListener('touchmove', (e) => e.preventDefault());
    }
  }, [collapsed]);

  return (
    <>
      {!collapsed && (
        <div
          className="sidebar-backdrop fixed inset-0 bg-overlay sm:hidden z-40"
          onClick={() => onCollapse(true)}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] transition-transform z-40 
          ${collapsed ? 'w-0 -translate-x-full' : 'w-[280px] sm:w-72 translate-x-0'}`}
      >
        <div
          className={`transition-opacity h-full flex flex-col bg-background relative border-r border-border shadow-sm
            ${collapsed ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="h-14 flex-none flex items-center justify-between px-4 sm:px-6 transition-colors bg-surface-sunken border-b border-border">
            <span className="text-base font-semibold">Menu</span>
            <button
              onClick={() => onCollapse(true)}
              className="inline-flex items-center justify-center rounded-md size-control-sm hover:bg-primary-tint hover:text-primary-tint-ink transition-colors"
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
                    <h2 className="text-sm font-semibold tracking-wider text-foreground-muted px-2 mb-2 uppercase">
                      {group.group}
                    </h2>
                    <div className="space-y-1">
                      {accessibleItems.map((item) => (
                        <button
                          key={item.key}
                          className={`w-full flex items-center gap-3 px-4 min-h-control-md rounded-lg transition-colors text-left
                            ${
                              location.pathname === item.key
                                ? 'bg-primary-tint text-primary hover:bg-primary-tint font-medium'
                                : 'text-foreground-muted hover:text-foreground hover:bg-primary-tint'
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
                            className: `transition-colors  ${
                              location.pathname === item.key
                                ? 'text-primary'
                                : ''
                            }`,
                          })}
                          <span className="text-base font-medium whitespace-nowrap">
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
