import { GlassWater, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

interface Glass {
  name: string;
  sizeInMl: number;
}

interface DrinkInfoProps {
  description?: string;
  defaultGlass?: Glass;
}

const DrinkInfo = ({ description, defaultGlass }: DrinkInfoProps) => {
  const { t } = useTranslation();
  return (
    <>
      {description && (
        <Card className="bg-surface-sunken">
          <CardContent className="p-3 sm:p-4">
            <h2 className="text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
              <Info className="size-6" />
              {t('drink_info.description')}
            </h2>
            <p className="text-foreground-muted text-base leading-relaxed">
              {description}
            </p>
          </CardContent>
        </Card>
      )}

      {defaultGlass && (
        <Card className="bg-surface-sunken">
          <CardContent className="p-3 sm:p-4">
            <h2 className="text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
              <GlassWater className="size-6" />
              {t('drink_info.preparation')}
            </h2>
            <div className="flex items-center justify-between text-base text-foreground-muted">
              <span>{t('drink_info.glass')}</span>
              <span className="font-medium text-foreground">
                {defaultGlass.name} ({defaultGlass.sizeInMl}
                {t('drink_info.ml_unit')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default DrinkInfo;
