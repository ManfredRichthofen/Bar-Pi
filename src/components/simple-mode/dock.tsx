import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Clock, Settings, GlassWater } from 'lucide-react';

const Dock: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? 'dock-active' : '';
  };

  return (
    <div className="dock position-fixed bottom-0 left-0 right-0">
      <button className={isActive('/simple/drinks')}>
        <Link to="/simple/drinks" className="flex flex-col items-center gap-1">
          <GlassWater className="h-6 w-6" />
          <span className="dock-label">{t('navigation.drinks')}</span>
        </Link>
      </button>

      <button className={isActive('/simple/order-status')}>
        <Link
          to="/simple/order-status"
          className="flex flex-col items-center gap-1"
        >
          <Clock className="h-6 w-6" />
          <span className="dock-label">{t('navigation.order_status')}</span>
        </Link>
      </button>

      <button className={isActive('/simple/settings')}>
        <Link
          to="/simple/settings"
          className="flex flex-col items-center gap-1"
        >
          <Settings className="h-6 w-6" />
          <span className="dock-label">{t('navigation.settings')}</span>
        </Link>
      </button>
    </div>
  );
};

export default Dock;
