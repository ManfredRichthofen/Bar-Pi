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
          <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
              <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
              Language
            </Label>
            <select
              id="language-select"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
              <Label
                htmlFor="notifications"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                Notifications
              </Label>
              <Switch id="notifications" />
            </div>

            <div className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
              <Label
                htmlFor="sound-effects"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Sound Effects
              </Label>
              <Switch id="sound-effects" />
            </div>

            <Separator />

            {/* Advanced Mode Switch */}
            <div className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
              <span className="text-sm font-medium">
                Switch to Advanced Mode
              </span>
              <Button onClick={onAdvancedModeSwitch} size="default">
                Switch
              </Button>
            </div>

            <Separator />

            {/* Logout Button */}
            <div className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
              <Label className="flex items-center gap-2">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
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
