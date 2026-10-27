import { Globe, LogOut, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-6" />
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Language</Label>
          <Select
            value={currentLanguage}
            onValueChange={(langCode) => {
              if (langCode) onLanguageChange(langCode);
            }}
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
              <p className="font-medium">Switch to Advanced Mode</p>
              <p className="text-sm text-foreground-muted">
                Access full management controls
              </p>
            </div>
          </div>
          <Button onClick={onAdvancedModeSwitch}>Switch</Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogOut className="size-6 text-foreground-muted" />
            <p className="font-medium">Logout</p>
          </div>
          <Button variant="destructive" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;
