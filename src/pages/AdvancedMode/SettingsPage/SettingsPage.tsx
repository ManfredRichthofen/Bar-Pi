import { useNavigate } from '@tanstack/react-router';
import { Globe, LogOut, Smartphone } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/AdvancedMode/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import UpdateChecker from '../../../components/UpdateChecker';
import useAuthStore from '../../../store/authStore';
import useUIModeStore from '../../../store/uiModeStore';
import ThemeSelector from '../../simple-mode/simpleSettings/components/ThemeSelector';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate({ from: '/settings' });
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
  ];

  const handleLanguageChange = (langCode: string | null) => {
    if (langCode) {
      i18n.changeLanguage(langCode);
    }
  };

  const handleSimpleModeSwitch = () => {
    setAdvancedMode(false);
    setTimeout(() => {
      navigate({ to: '/simple/drinks', replace: true });
    }, 0);
  };

  const handleLogout = () => {
    logoutUser();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('settings.title', 'Settings')}
        subtitle="Language, updates and appearance"
      />

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="space-y-6">
          <UpdateChecker />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-6" />
                {t('settings.general.title', 'General Settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('settings.general.language_label', 'Language')}
                </label>
                <Select
                  value={i18n.resolvedLanguage ?? 'en'}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-6 text-foreground-muted" />
                  <div>
                    <p className="font-medium">Switch to Simple Mode</p>
                    <p className="text-sm text-foreground-muted">
                      Use simplified interface
                    </p>
                  </div>
                </div>
                <Button onClick={handleSimpleModeSwitch}>Switch</Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogOut className="size-6 text-foreground-muted" />
                  <div>
                    <p className="font-medium">
                      {t('common.logout', 'Logout')}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      Sign out of your account
                    </p>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleLogout}>
                  {t('common.logout', 'Logout')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <ThemeSelector />
        </div>
      </div>
    </div>
  );
};
