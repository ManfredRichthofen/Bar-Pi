import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import PumpSettingsService from '../../../../services/pumpsettings.service';
import useAuthStore from '../../../../store/authStore';
import { usePumpStore } from '../../../../store/pumpStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible } from '@/components/ui/collapsible';

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
        <CardHeader className="bg-muted/50 rounded-t-2xl border-b">
          <CardTitle className="text-base sm:text-lg">
            {t('pump_status.headline')}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <div className="py-4">
            <h3 className="font-medium mb-3 text-muted-foreground text-sm">
              {t('pump_status.pumps_headline')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 sm:gap-x-4">
              <div className="text-sm flex justify-between sm:block">
                <span className="sm:hidden">
                  {t('pump_status.pumps_installed')}
                </span>
                <span className="hidden sm:block">
                  {t('pump_status.pumps_installed')}
                </span>
                <span className="sm:hidden">
                  <Badge variant="default">{nrPumps}</Badge>
                </span>
              </div>
              <div className="hidden sm:block text-right">
                <Badge variant="default">{nrPumps}</Badge>
              </div>
              <div className="text-sm flex justify-between sm:block">
                <span className="sm:hidden">
                  {t('pump_status.pumps_ingredients_installed')}
                </span>
                <span className="hidden sm:block">
                  {t('pump_status.pumps_ingredients_installed')}
                </span>
                <span className="sm:hidden">
                  <Badge variant="default">{nrIngredientsInstalled}</Badge>
                </span>
              </div>
              <div className="hidden sm:block text-right">
                <Badge variant="default">{nrIngredientsInstalled}</Badge>
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-muted-foreground text-sm">
                {t('pump_status.reverse_pumping_headline')}
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigate({ to: '/reversepumpsettings' })}
                title={t('common.edit')}
              >
                <Pencil />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 sm:gap-x-4">
              <div className="text-sm flex justify-between sm:block">
                <span className="sm:hidden">
                  {t('pump_status.reverse_pumping')}
                </span>
                <span className="hidden sm:block">
                  {t('pump_status.reverse_pumping')}
                </span>
                <span className="sm:hidden">
                  <Badge
                    variant={
                      reversePumpSettings?.enable ? 'default' : 'destructive'
                    }
                  >
                    {reversePumpingStatus}
                  </Badge>
                </span>
              </div>
              <div className="hidden sm:block text-right">
                <Badge
                  variant={
                    reversePumpSettings?.enable ? 'default' : 'destructive'
                  }
                >
                  {reversePumpingStatus}
                </Badge>
              </div>
              {reversePumpSettings?.enable && (
                <>
                  <div className="text-sm flex justify-between sm:block">
                    <span className="sm:hidden">
                      {t('pump_status.reverse_pumping_overshoot')}
                    </span>
                    <span className="hidden sm:block">
                      {t('pump_status.reverse_pumping_overshoot')}
                    </span>
                    <span className="sm:hidden">
                      <Badge variant="outline">
                        {reversePumpSettings?.settings?.overshoot || 0}%
                      </Badge>
                    </span>
                  </div>
                  <div className="hidden sm:block text-right">
                    <Badge variant="outline">
                      {reversePumpSettings?.settings?.overshoot || 0}%
                    </Badge>
                  </div>
                  <div className="text-sm flex justify-between sm:block">
                    <span className="sm:hidden">
                      {t('pump_status.reverse_pumping_timer')}
                    </span>
                    <span className="hidden sm:block">
                      {t('pump_status.reverse_pumping_timer')}
                    </span>
                    <span className="sm:hidden">
                      <Badge variant="outline">
                        {reversePumpSettings?.settings?.autoPumpBackTimer || 0}{' '}
                        min
                      </Badge>
                    </span>
                  </div>
                  <div className="hidden sm:block text-right">
                    <Badge variant="outline">
                      {reversePumpSettings?.settings?.autoPumpBackTimer || 0}{' '}
                      min
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="py-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-muted-foreground text-sm">
                {t('pump_status.load_cell_headline')}
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigate({ to: '/reversepumpsettings' } as any)}
                title={t('common.edit')}
              >
                <Pencil />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 sm:gap-x-4">
              <div className="text-sm flex justify-between sm:block">
                <span className="sm:hidden">
                  {t('pump_status.load_cell_status')}
                </span>
                <span className="hidden sm:block">
                  {t('pump_status.load_cell_status')}
                </span>
                <span className="sm:hidden">
                  <Badge
                    variant={
                      loadCellSettings?.enable ? 'default' : 'destructive'
                    }
                  >
                    {loadCellStatus}
                  </Badge>
                </span>
              </div>
              <div className="hidden sm:block text-right">
                <Badge
                  variant={loadCellSettings?.enable ? 'default' : 'destructive'}
                >
                  {loadCellStatus}
                </Badge>
              </div>
              {loadCellSettings?.enable && (
                <>
                  <div className="text-sm flex justify-between sm:block">
                    <span className="sm:hidden">
                      {t('pump_status.load_cell_calibrated')}
                    </span>
                    <span className="hidden sm:block">
                      {t('pump_status.load_cell_calibrated')}
                    </span>
                    <span className="sm:hidden">
                      <Badge
                        variant={
                          loadCellSettings?.calibrated
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {loadCellCalibrated}
                      </Badge>
                    </span>
                  </div>
                  <div className="hidden sm:block text-right">
                    <Badge
                      variant={
                        loadCellSettings?.calibrated ? 'default' : 'destructive'
                      }
                    >
                      {loadCellCalibrated}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
