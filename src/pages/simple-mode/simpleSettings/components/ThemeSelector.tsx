import { Check, Palette } from 'lucide-react';
import { m } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { usePress } from '@/hooks/usePress';
import { cn } from '@/lib/utils';
import useThemeStore, { THEMES } from '@/store/themeStore';

const ThemeSelector = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const press = usePress({ lift: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-6" />
          {t('settings.appearance.title', 'Appearance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            {t('simple_settings.theme', 'Theme')}
          </Label>
          <div
            role="radiogroup"
            aria-label={t('simple_settings.theme', 'Theme')}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {THEMES.map((option) => {
              const selected = theme === option.id;
              return (
                <m.label
                  key={option.id}
                  data-theme={option.id}
                  {...press}
                  className={cn(
                    'bg-background text-foreground has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring relative flex min-h-control-lg cursor-pointer flex-col items-start justify-center gap-0.5 rounded-lg border-2 px-4 py-3 pr-14 text-left transition-colors duration-150 ease-out',
                    selected
                      ? 'border-primary ring-4 ring-primary-tint'
                      : 'border-border-strong',
                  )}
                >
                  {selected && (
                    <span
                      aria-hidden="true"
                      className="absolute right-4 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Check className="size-5" />
                    </span>
                  )}
                  <input
                    type="radio"
                    name="theme"
                    value={option.id}
                    checked={selected}
                    onChange={() => setTheme(option.id)}
                    className="sr-only"
                  />
                  <span className="font-bold">
                    {t(`simple_settings.theme_${option.id}`, option.label)}
                  </span>
                  <span className="text-foreground-muted text-sm">
                    {t(
                      `simple_settings.theme_${option.id}_description`,
                      option.description,
                    )}
                  </span>
                </m.label>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
