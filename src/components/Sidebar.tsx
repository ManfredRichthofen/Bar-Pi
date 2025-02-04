import React from 'react';
import {
  GlassWater,
  Heart,
  Settings,
  ArrowLeftToLine,
  BookText,
  Users,
  LayoutGrid,
  Gauge,
  Martini,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
          icon: <BookText size={16} />,
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
          icon: <LayoutGrid size={16} />,
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

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] transition-all duration-300 z-20 ${
        collapsed ? 'w-0 -translate-x-full' : 'w-72 translate-x-0'
      }`}
    >
      <div
        className={`transition-all duration-300 h-full flex flex-col bg-base-100 relative border-r border-base-200 ${
          collapsed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="h-14 flex-none flex items-center justify-between px-6 transition-colors duration-300 bg-base-100 border-b border-base-200">
          <span className="text-base font-semibold text-base-content/90">
            Menu
          </span>
          <button
            onClick={() => onCollapse(true)}
            className="btn btn-ghost btn-sm btn-square hover:bg-base-200/80 active:bg-base-300"
          >
            <ArrowLeftToLine size={16} className="text-base-content/70" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 hover:scrollbar-thumb-base-300/80 scrollbar-track-transparent">
          <ul className="menu menu-sm p-4 gap-2 transition-colors duration-300 bg-base-100">
            {menuItems.map((group) => (
              <li key={group.group} className="mb-6">
                <h2 className="menu-title text-xs font-semibold tracking-wider text-base-content/50 px-2 mb-3 uppercase">
                  {group.group}
                </h2>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <a
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 
                          ${
                            location.pathname === item.key
                              ? 'bg-primary/10 text-primary hover:bg-primary/15 shadow-sm'
                              : 'text-base-content/70 hover:text-base-content hover:bg-base-200/70'
                          }
                          active:scale-[0.98] active:bg-base-300`}
                        onClick={() => navigate(item.key)}
                      >
                        {React.cloneElement(item.icon, {
                          size: 18,
                          strokeWidth: 2,
                          className: `transition-colors duration-300 ${
                            location.pathname === item.key
                              ? 'text-primary'
                              : 'text-base-content/60 group-hover:text-base-content'
                          }`,
                        })}
                        <span className="font-medium text-sm">
                          {item.label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
