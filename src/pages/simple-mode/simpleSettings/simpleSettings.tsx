import { useEffect } from 'react';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import useUIModeStore from '../../../store/uiModeStore';
import UpdateChecker from '../../../components/UpdateChecker';
import ThemeSelector from './components/ThemeSelector';
import GeneralSettings from './components/GeneralSettings';

const SimpleSettings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);

  useEffect(() => {
    themeChange(false);
  }, []);

  const themes = [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
  ];

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleAdvancedModeSwitch = () => {
    setAdvancedMode(true);
    setTimeout(() => {
      navigate({ to: '/drinks', replace: true });
    }, 0);
  };

  const handleLogout = () => {
    logoutUser();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: '/simple/drinks' })}
            className="btn btn-ghost btn-sm p-2 sm:p-3 hover:bg-base-200 rounded-xl transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold truncate flex-1 mx-2 sm:mx-3 text-center text-base-content">
            {t('settings.title', 'Settings')}
          </h1>
          <div className="w-8 sm:w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          {/* Update Check Card */}
          <UpdateChecker />

          {/* General Settings Card */}
          <GeneralSettings
            currentLanguage={i18n.language}
            languages={languages}
            onLanguageChange={handleLanguageChange}
            onAdvancedModeSwitch={handleAdvancedModeSwitch}
            onLogout={handleLogout}
          />

          {/* Theme Selector Card */}
          <ThemeSelector themes={themes} />
        </div>
      </div>
    </div>
  );
};

export default SimpleSettings;
