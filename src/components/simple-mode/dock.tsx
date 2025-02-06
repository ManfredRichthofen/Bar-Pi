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
    <div className="dock">
      <button className={isActive('/simple/drinks')}>
        <Link to="/simple/drinks" className="flex flex-col items-center gap-1">
          <GlassWater className="h-6 w-6" />
          <span className="dock-label">{t('Drinks')}</span>
        </Link>
      </button>

      <button className={isActive('/simple/order')}>
        <Link to="/simple/order" className="flex flex-col items-center gap-1">
          <Clock className="h-6 w-6" />
          <span className="dock-label">{t('Order Status')}</span>
        </Link>
      </button>

      <button className={isActive('/simple/settings')}>
        <Link
          to="/simple/settings"
          className="flex flex-col items-center gap-1"
        >
          <Settings className="h-6 w-6" />
          <span className="dock-label">{t('Settings')}</span>
        </Link>
      </button>
    </div>
  );
};

export default Dock;
