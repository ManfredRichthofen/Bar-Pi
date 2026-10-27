import { Palette } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSimplePress } from '@/hooks/useSimplePress';
import { cn } from '@/lib/utils';
import useThemeStore, { THEMES } from '@/store/themeStore';

const ThemeSelector = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const press = useSimplePress({ lift: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-6" />
          {t('settings.appearance.title', 'Appearance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="text-base font-semibold">
          {t('simple_settings.theme', 'Theme')}
        </Label>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {THEMES.map((option) => {
            const selected = theme === option.id;
            return (
              <motion.label
                key={option.id}
                data-theme={option.id}
                {...press}
                className={cn(
                  'bg-background text-foreground has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring flex min-h-control-lg cursor-pointer flex-col items-start justify-center gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-colors duration-150 ease-out',
                  selected ? 'border-foreground' : 'border-border-strong',
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.id}
                  checked={selected}
                  onChange={() => setTheme(option.id)}
                  className="sr-only"
                />
                <span className="font-bold">{option.label}</span>
                <span className="text-foreground-muted text-sm">
                  {option.description}
                </span>
              </motion.label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
