import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Clock, Settings, GlassWater } from 'lucide-react';

const Dock: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50">
      <div className="flex justify-around items-center h-16 px-4">
        <button className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${
          isActive('/simple/drinks') 
            ? 'bg-primary text-primary-content shadow-md' 
            : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
        }`}>
          <Link to="/simple/drinks" className="flex flex-col items-center gap-1">
            <GlassWater className="h-5 w-5" />
            <span className="text-xs font-medium">{t('navigation.drinks')}</span>
          </Link>
        </button>

        <button className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${
          isActive('/simple/order-status') 
            ? 'bg-primary text-primary-content shadow-md' 
            : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
        }`}>
          <Link
            to="/simple/order-status"
            className="flex flex-col items-center gap-1"
          >
            <Clock className="h-5 w-5" />
            <span className="text-xs font-medium">{t('navigation.order_status')}</span>
          </Link>
        </button>

        <button className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${
          isActive('/simple/settings') 
            ? 'bg-primary text-primary-content shadow-md' 
            : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
        }`}>
          <Link
            to="/simple/settings"
            className="flex flex-col items-center gap-1"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">{t('navigation.settings')}</span>
          </Link>
        </button>
      </div>
    </div>
  );
};

export default Dock;
