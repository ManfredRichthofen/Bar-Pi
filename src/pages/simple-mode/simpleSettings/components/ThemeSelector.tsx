import { Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import useThemeStore, { THEMES } from '@/store/themeStore';

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-5" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="text-base font-semibold">Theme</Label>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {THEMES.map((t) => {
            const selected = theme === t.id;
            return (
              <label
                key={t.id}
                data-theme={t.id}
                className={cn(
                  'bg-background text-foreground has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring flex min-h-control-lg cursor-pointer flex-col items-start justify-center gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-colors active:scale-[0.98]',
                  selected ? 'border-foreground' : 'border-border-strong',
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.id}
                  checked={selected}
                  onChange={() => setTheme(t.id)}
                  className="sr-only"
                />
                <span className="font-bold">{t.label}</span>
                <span className="text-foreground-muted text-sm">
                  {t.description}
                </span>
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
