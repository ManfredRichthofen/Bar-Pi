import { Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import useThemeStore from '@/store/themeStore';

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Theme Mode</Label>
          <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
