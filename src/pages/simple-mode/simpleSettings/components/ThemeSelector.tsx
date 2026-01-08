import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface ThemeSelectorProps {
  themes: string[];
}

const ThemeSelector = ({ themes }: ThemeSelectorProps) => {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Theme Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Theme Mode</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="gap-2"
              size="sm"
            >
              <Sun className="w-4 h-4" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="gap-2"
              size="sm"
            >
              <Moon className="w-4 h-4" />
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="gap-2"
              size="sm"
            >
              <Monitor className="w-4 h-4" />
              Auto
            </Button>
          </div>
          {theme === 'system' && (
            <p className="text-xs text-muted-foreground">
              Currently using: {currentTheme === 'dark' ? 'Dark' : 'Light'} (system preference)
            </p>
          )}
        </div>

        {/* DaisyUI Theme Selector (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="theme-select" className="flex items-center gap-2 text-sm font-medium">
            <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
            Color Theme (Optional)
          </Label>
          <select
            id="theme-select"
            defaultValue="default"
            onChange={(e) => {
              if (e.target.value !== 'default') {
                document.documentElement.setAttribute('data-theme', e.target.value);
              } else {
                document.documentElement.removeAttribute('data-theme');
              }
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="default">Default</option>
            {themes.filter(t => !['light', 'dark'].includes(t)).map((theme) => (
              <option key={theme} value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Choose a color scheme variant (experimental)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
