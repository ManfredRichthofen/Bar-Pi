import {
  Bell,
  Globe,
  LogOut,
  Settings as SettingsIcon,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="size-6" />
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Language Selector */}
          <div className="space-y-2">
            <Label
              htmlFor="language-select"
              className="flex items-center gap-2"
            >
              <Globe className="size-6" />
              Language
            </Label>
            <select
              id="language-select"
              className="min-h-control-md w-full rounded-md border border-border-strong bg-surface px-4 text-base shadow-inset focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <Separator />

          {/* Toggle Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 px-3 min-h-control-md hover:bg-muted/50 rounded-lg transition-colors">
              <Label
                htmlFor="notifications"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Bell className="size-6" />
                Notifications
              </Label>
              <Switch id="notifications" />
            </div>

            <div className="flex items-center justify-between py-3 px-3 min-h-control-md hover:bg-muted/50 rounded-lg transition-colors">
              <Label
                htmlFor="sound-effects"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="size-6" />
                Sound Effects
              </Label>
              <Switch id="sound-effects" />
            </div>

            <Separator />

            {/* Advanced Mode Switch */}
            <div className="flex items-center justify-between py-3 px-3 min-h-control-md hover:bg-muted/50 rounded-lg transition-colors">
              <span className="text-base font-medium">
                Switch to Advanced Mode
              </span>
              <Button onClick={onAdvancedModeSwitch} size="default">
                Switch
              </Button>
            </div>

            <Separator />

            {/* Logout Button */}
            <div className="flex items-center justify-between py-3 px-3 min-h-control-md hover:bg-muted/50 rounded-lg transition-colors">
              <Label className="flex items-center gap-2">
                <LogOut className="size-6" />
                Logout
              </Label>
              <Button variant="destructive" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;
