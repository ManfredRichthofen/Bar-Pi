import { Clock, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

interface Glass {
  name: string;
  sizeInMl: number;
}

interface DrinkInfoProps {
  description?: string;
  alcoholic: boolean;
  defaultGlass?: Glass;
}

const DrinkInfo = ({
  description,
  alcoholic,
  defaultGlass,
}: DrinkInfoProps) => {
  const { t } = useTranslation();
  return (
    <>
      {/* Description */}
      {description && (
        <Card className="bg-surface-sunken">
          <CardContent className="p-3 sm:p-4">
            <h2 className="text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
              <Info className="size-6" />
              {t('drink_info.description')}
            </h2>
            <p className="text-foreground-muted text-sm leading-relaxed">
              {description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      <Card className="bg-surface-sunken">
        <CardContent className="p-3 sm:p-4">
          <h2 className="text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
            <Clock className="size-6" />
            {t('drink_info.preparation')}
          </h2>
          <div className="space-y-1.5 sm:space-y-2 text-sm text-foreground-muted">
            <div className="flex items-center justify-between">
              <span>{t('drink_info.type')}:</span>
              <span className="font-medium">
                {alcoholic
                  ? t('drink_info.alcoholic')
                  : t('drink_info.non_alcoholic')}
              </span>
            </div>
            {defaultGlass && (
              <div className="flex items-center justify-between">
                <span>{t('drink_info.glass')}:</span>
                <span className="font-medium">
                  {defaultGlass.name} ({defaultGlass.sizeInMl}
                  {t('drink_info.ml_unit')})
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default DrinkInfo;
