import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SimplePageEnter from '@/components/simple-mode/SimplePageEnter';
import { Button } from '@/components/ui/button';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import AppUpdateChecker from '../../../components/AppUpdateChecker';
import UpdateChecker from '../../../components/UpdateChecker';
import useAuthStore from '../../../store/authStore';
import useUIModeStore from '../../../store/uiModeStore';
import GeneralSettings from './components/GeneralSettings';
import ThemeSelector from './components/ThemeSelector';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
];

const SimpleSettings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate({ from: '/simple/settings' });
  const goBack = useBackNavigation('/simple/drinks');
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);

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
            aria-label={t('common.back', 'Back')}
            onClick={goBack}
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
        <SimplePageEnter className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-6">
          <UpdateChecker />
          <AppUpdateChecker />

          <GeneralSettings
            currentLanguage={i18n.resolvedLanguage ?? 'en'}
            languages={LANGUAGES}
            onLanguageChange={handleLanguageChange}
            onAdvancedModeSwitch={handleAdvancedModeSwitch}
            onLogout={handleLogout}
          />

          <ThemeSelector />
        </SimplePageEnter>
      </div>
    </div>
  );
};

export default SimpleSettings;
