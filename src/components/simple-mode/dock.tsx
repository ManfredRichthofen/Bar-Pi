import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from '@tanstack/react-router';
import { Clock, Settings, GlassWater } from 'lucide-react';

const Dock: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100/95 backdrop-blur-md border-t border-base-300 z-50 shadow-lg">
      <div className="flex justify-around items-center h-20 px-2 max-w-md mx-auto">
        <Link 
          to="/simple/drinks" 
          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-200 min-w-[4rem] ${
            isActive('/simple/drinks') 
              ? 'bg-primary text-primary-content shadow-lg scale-105' 
              : 'text-base-content/70 hover:text-base-content hover:bg-base-200 active:scale-95'
          }`}
        >
          <GlassWater className="h-6 w-6" />
          <span className="text-xs font-medium">{t('navigation.drinks')}</span>
        </Link>

        <Link
          to="/simple/order-status"
          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-200 min-w-[4rem] ${
            isActive('/simple/order-status') 
              ? 'bg-primary text-primary-content shadow-lg scale-105' 
              : 'text-base-content/70 hover:text-base-content hover:bg-base-200 active:scale-95'
          }`}
        >
          <Clock className="h-6 w-6" />
          <span className="text-xs font-medium">{t('navigation.order_status')}</span>
        </Link>

        <Link
          to="/simple/settings"
          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-200 min-w-[4rem] ${
            isActive('/simple/settings') 
              ? 'bg-primary text-primary-content shadow-lg scale-105' 
              : 'text-base-content/70 hover:text-base-content hover:bg-base-200 active:scale-95'
          }`}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs font-medium">{t('navigation.settings')}</span>
        </Link>
      </div>
    </div>
  );
};

export default Dock;
