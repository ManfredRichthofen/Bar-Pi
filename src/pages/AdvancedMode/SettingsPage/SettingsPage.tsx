import { useNavigate } from '@tanstack/react-router';
import { KeyRound, LogOut, Smartphone, UserRound } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import AppUpdateChecker from '../../../components/AppUpdateChecker';
import { MqttSettings } from '../../../components/mqtt/MqttSettings';
import UpdateChecker from '../../../components/UpdateChecker';
import SystemService from '../../../services/system.service';
import useAuthStore from '../../../store/authStore';
import useUIModeStore from '../../../store/uiModeStore';
import ThemeSelector from '../../simple-mode/simpleSettings/components/ThemeSelector';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate({ from: '/settings' });
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const token = useAuthStore((state) => state.token);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);
  const [requirePinAfterDrink, setRequirePinAfterDrink] = useState(false);
  const [pinLoginEnabled, setPinLoginEnabled] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policySaving, setPolicySaving] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
  ];

  useEffect(() => {
    let cancelled = false;
    const loadPolicy = async () => {
      if (!token) {
        setPolicyLoading(false);
        return;
      }
      try {
        const [policy, loginSettings] = await Promise.all([
          SystemService.getOrderingPolicy(token),
          SystemService.getLoginSettings().catch(() => null),
        ]);
        if (!cancelled) {
          setRequirePinAfterDrink(!!policy?.requirePinAfterDrink);
          setPinLoginEnabled(!!loginSettings?.pinLoginEnabled);
        }
      } catch (error) {
        console.error('Failed to load ordering policy:', error);
      } finally {
        if (!cancelled) {
          setPolicyLoading(false);
        }
      }
    };
    loadPolicy();
    return () => {
      cancelled = true;
    };
  }, [token]);

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

  const handleRequirePinToggle = async (checked: boolean) => {
    setRequirePinAfterDrink(checked);
    setPolicySaving(true);
    try {
      await SystemService.setOrderingPolicy(
        { requirePinAfterDrink: checked },
        token,
      );
    } catch (error) {
      console.error('Failed to save ordering policy:', error);
      setRequirePinAfterDrink(!checked);
    } finally {
      setPolicySaving(false);
    }
  };

  const handlePinLoginToggle = async (checked: boolean) => {
    setPinLoginEnabled(checked);
    setPolicySaving(true);
    try {
      await SystemService.setLoginSettings({ pinLoginEnabled: checked }, token);
    } catch (error) {
      console.error('Failed to save login settings:', error);
      setPinLoginEnabled(!checked);
    } finally {
      setPolicySaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('settings.title', 'Settings')}
        subtitle="Appearance, ordering, updates and account"
      />

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="space-y-6">
          <ThemeSelector>
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
          </ThemeSelector>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-6" />
                {t('settings.ordering.title', 'Ordering')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {t(
                      'settings.ordering.enable_pin_login',
                      'Enable PIN login',
                    )}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {t(
                      'settings.ordering.enable_pin_login_help',
                      'Show a PIN pad on the login screen. When off, users sign in with username and password.',
                    )}
                  </p>
                </div>
                <Switch
                  checked={pinLoginEnabled}
                  disabled={policyLoading || policySaving || !token}
                  onCheckedChange={handlePinLoginToggle}
                />
              </div>

              <Separator />

              <div
                className={`flex items-center justify-between gap-4 ${
                  pinLoginEnabled ? '' : 'opacity-50'
                }`}
              >
                <div>
                  <p className="font-medium">
                    {t(
                      'settings.ordering.require_pin_after_drink',
                      'Require PIN after every drink',
                    )}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {t(
                      'settings.ordering.require_pin_after_drink_help',
                      'After a drink finishes, users must enter their PIN again before ordering another.',
                    )}
                  </p>
                </div>
                <Switch
                  checked={pinLoginEnabled && requirePinAfterDrink}
                  disabled={
                    policyLoading || policySaving || !token || !pinLoginEnabled
                  }
                  onCheckedChange={handleRequirePinToggle}
                />
              </div>
            </CardContent>
          </Card>

          <MqttSettings />

          <UpdateChecker />
          <AppUpdateChecker />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-6" />
                {t('settings.account.title', 'Account')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
        </div>
      </div>
    </div>
  );
};
