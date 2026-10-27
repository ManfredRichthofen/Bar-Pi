import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import UpdateChecker from '../../../components/UpdateChecker';
import useAuthStore from '../../../store/authStore';
import useUIModeStore from '../../../store/uiModeStore';
import GeneralSettings from './components/GeneralSettings';
import ThemeSelector from './components/ThemeSelector';

const SimpleSettings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate({ from: '/simple/settings' });
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);

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
    navigate({ to: '/drinks' });
  };

  const handleLogout = () => {
    logoutUser();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 border-b-hairline border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/simple/drinks' })}
          >
            <ArrowLeft className="size-6" />
          </Button>
          <h1 className="text-xl font-bold truncate flex-1 mx-3 text-center text-foreground">
            {t('settings.title', 'Settings')}
          </h1>
          <div className="size-control-md" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-6">
          <UpdateChecker />

          <GeneralSettings
            currentLanguage={i18n.language}
            languages={languages}
            onLanguageChange={handleLanguageChange}
            onAdvancedModeSwitch={handleAdvancedModeSwitch}
            onLogout={handleLogout}
          />

          <ThemeSelector />
        </div>
      </div>
    </div>
  );
};

export default SimpleSettings;
