import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { LogOut, Moon, Sun, Globe, Bell, Volume2, Smartphone } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import useUIModeStore from '../../../store/uiModeStore';
import UpdateChecker from '../../../components/UpdateChecker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);

  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(false);
  const [soundEffects, setSoundEffects] = React.useState(false);

  useEffect(() => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    setIsDarkMode(currentTheme === 'dark');
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, []);

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  const handleLanguageChange = (langCode: string | null) => {
    if (langCode) {
      i18n.changeLanguage(langCode);
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    const theme = checked ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', checked);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
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
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{t('settings.title', 'Settings')}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="space-y-6">
          <UpdateChecker />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings.general.title', 'General Settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('settings.general.language_label', 'Language')}
                </label>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t('settings.general.notifications', 'Notifications')}</p>
                      <p className="text-sm text-muted-foreground">Receive system notifications</p>
                    </div>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t('settings.general.sound_effects', 'Sound Effects')}</p>
                      <p className="text-sm text-muted-foreground">Play sounds for actions</p>
                    </div>
                  </div>
                  <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Switch to Simple Mode</p>
                    <p className="text-sm text-muted-foreground">Use simplified interface</p>
                  </div>
                </div>
                <Button onClick={handleSimpleModeSwitch}>
                  Switch
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('common.logout', 'Logout')}</p>
                    <p className="text-sm text-muted-foreground">Sign out of your account</p>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleLogout}>
                  {t('common.logout', 'Logout')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                {t('settings.appearance.title', 'Appearance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                    </p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
