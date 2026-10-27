import { Globe, LogOut, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Language {
  code: string;
  name: string;
}

interface GeneralSettingsProps {
  currentLanguage: string;
  languages: Language[];
  onLanguageChange: (langCode: string) => void;
  onAdvancedModeSwitch: () => void;
  onLogout: () => void;
}

const GeneralSettings = ({
  currentLanguage,
  languages,
  onLanguageChange,
  onAdvancedModeSwitch,
  onLogout,
}: GeneralSettingsProps) => {
  const { t } = useTranslation();
  const [confirmAdvanced, setConfirmAdvanced] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-6" />
          {t('settings.general.title', 'General Settings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('settings.general.language_label', 'Language')}
          </Label>
          <Select
            value={currentLanguage}
            onValueChange={(langCode) => {
              if (langCode) onLanguageChange(langCode);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {languages.find((lang) => lang.code === currentLanguage)
                  ?.name ?? currentLanguage}
              </SelectValue>
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

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SlidersHorizontal className="size-6 shrink-0 text-foreground-muted" />
            <div className="min-w-0">
              <p className="font-medium">
                {t('simple_settings.advanced_title', 'Switch to Advanced Mode')}
              </p>
              <p className="text-sm text-foreground-muted">
                {t(
                  'simple_settings.advanced_hint',
                  'Access full management controls',
                )}
              </p>
            </div>
          </div>
          <Button className="shrink-0" onClick={() => setConfirmAdvanced(true)}>
            {t('simple_settings.advanced_button', 'Switch')}
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LogOut className="size-6 text-foreground-muted" />
            <p className="font-medium">{t('common.logout', 'Logout')}</p>
          </div>
          <Button variant="destructive" onClick={() => setConfirmLogout(true)}>
            {t('common.logout', 'Logout')}
          </Button>
        </div>
      </CardContent>

      <ConfirmationDialog
        open={confirmAdvanced}
        onOpenChange={setConfirmAdvanced}
        title={t('simple_settings.advanced_confirm_title', 'Switch to Advanced Mode?')}
        description={t(
          'simple_settings.advanced_confirm_description',
          'Advanced mode shows pump, recipe and user management. Guests should stay in simple mode.',
        )}
        confirmText={t('simple_settings.advanced_button', 'Switch')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={() => {
          setConfirmAdvanced(false);
          onAdvancedModeSwitch();
        }}
      />

      <ConfirmationDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title={t('simple_settings.logout_confirm_title', 'Log out?')}
        description={t(
          'simple_settings.logout_confirm_description',
          'You will need to sign in again to order drinks.',
        )}
        confirmText={t('common.logout', 'Logout')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={() => {
          setConfirmLogout(false);
          onLogout();
        }}
        variant="destructive"
      />
    </Card>
  );
};

export default GeneralSettings;
