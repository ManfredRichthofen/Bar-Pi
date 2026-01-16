import { useNavigate } from '@tanstack/react-router';
import { ChevronsUpDown, Pencil } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import PumpSettingsService from '../../../../services/pumpsettings.service';
import useAuthStore from '../../../../store/authStore';
import { usePumpStore } from '../../../../store/pumpStore';

export const PumpStatus: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: '/pumps' });
  const token = useAuthStore((state) => state.token);
  const pumps = usePumpStore((state) => state.pumps);

  const [reversePumpSettings, setReversePumpSettings] = useState<any>({});
  const [loadCellSettings, setLoadCellSettings] = useState({
    enable: false,
    clkPin: null,
    dtPin: null,
    calibrated: false,
  });

  useEffect(() => {
    if (token) {
      PumpSettingsService.getLoadCell(token).then((data) => {
        const newLoadCell = {
          ...data,
          calibrated: !!data?.calibrated,
          enable: !!data,
        };
        setLoadCellSettings(newLoadCell);
      });
      PumpSettingsService.getReversePumpSettings(token).then((data) => {
        setReversePumpSettings(data || {});
      });
    }
  }, [token]);

  const nrPumps = pumps?.length || 0;
  const nrIngredientsInstalled =
    pumps?.filter((x: any) => !!x.currentIngredient).length || 0;

  const reversePumpingStatus = reversePumpSettings?.enable
    ? t('pump_status.reverse_pumping_status_enabled')
    : t('pump_status.reverse_pumping_status_disabled');

  const loadCellStatus = loadCellSettings?.enable
    ? t('pump_status.load_cell_status_enabled')
    : t('pump_status.load_cell_status_disabled');

  const loadCellCalibrated = loadCellSettings?.calibrated
    ? t('pump_status.load_cell_calibrated_yes')
    : t('pump_status.load_cell_calibrated_no');

  return (
    <Card>
      <Collapsible
        defaultOpen={typeof window !== 'undefined' && window.innerWidth > 768}
      >
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">
              {t('pump_status.headline')}
            </CardTitle>
            <CollapsibleTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="divide-y divide-border/50">
            <div className="py-5">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                {t('pump_status.pumps_headline')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">
                    {t('pump_status.pumps_installed')}
                  </span>
                  <Badge variant="default" className="font-semibold">
                    {nrPumps}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">
                    {t('pump_status.pumps_ingredients_installed')}
                  </span>
                  <Badge variant="default" className="font-semibold">
                    {nrIngredientsInstalled}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="py-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  {t('pump_status.reverse_pumping_headline')}
                </h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigate({ to: '/reversepumpsettings' })}
                  title={t('common.edit')}
                  className="-mr-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">
                    {t('pump_status.reverse_pumping')}
                  </span>
                  <Badge
                    variant={
                      reversePumpSettings?.enable ? 'default' : 'destructive'
                    }
                    className="font-semibold"
                  >
                    {reversePumpingStatus}
                  </Badge>
                </div>
                {reversePumpSettings?.enable && (
                  <>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">
                        {t('pump_status.reverse_pumping_overshoot')}
                      </span>
                      <Badge variant="outline" className="font-semibold">
                        {reversePumpSettings?.settings?.overshoot || 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">
                        {t('pump_status.reverse_pumping_timer')}
                      </span>
                      <Badge variant="outline" className="font-semibold">
                        {reversePumpSettings?.settings?.autoPumpBackTimer || 0}{' '}
                        min
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="py-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  {t('pump_status.load_cell_headline')}
                </h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    navigate({ to: '/reversepumpsettings' } as any)
                  }
                  title={t('common.edit')}
                  className="-mr-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">
                    {t('pump_status.load_cell_status')}
                  </span>
                  <Badge
                    variant={
                      loadCellSettings?.enable ? 'default' : 'destructive'
                    }
                    className="font-semibold"
                  >
                    {loadCellStatus}
                  </Badge>
                </div>
                {loadCellSettings?.enable && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">
                      {t('pump_status.load_cell_calibrated')}
                    </span>
                    <Badge
                      variant={
                        loadCellSettings?.calibrated ? 'default' : 'destructive'
                      }
                      className="font-semibold"
                    >
                      {loadCellCalibrated}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
