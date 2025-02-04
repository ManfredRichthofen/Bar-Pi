import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import PumpSettingsService from '../../services/pumpsettings.service';
import useAuthStore from '../../store/authStore';
import { usePumpStore } from '../../store/pumpStore';

const PumpStatus = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const pumps = usePumpStore((state) => state.pumps);

  // Local state for pump settings
  const [reversePumpSettings, setReversePumpSettings] = useState({});
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

  // Derived values with null checks
  const nrPumps = pumps?.length || 0;
  const nrIngredientsInstalled = pumps?.filter((x) => !!x.currentIngredient).length || 0;

  const reversePumpingStatus = reversePumpSettings?.enable
    ? t('pump_status_reverse_pumping_status_enabled')
    : t('pump_status_reverse_pumping_status_disabled');

  const loadCellStatus = loadCellSettings?.enable
    ? t('pump_status_load_cell_status_enabled')
    : t('pump_status_load_cell_status_disabled');

  const loadCellCalibrated = loadCellSettings?.calibrated
    ? t('pump_status_load_cell_calibrated_yes')
    : t('pump_status_load_cell_calibrated_no');

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="collapse collapse-arrow">
        <input type="checkbox" defaultChecked={window.innerWidth > 768} />
        <div className="collapse-title bg-base-200 rounded-t-2xl font-semibold text-lg flex items-center">
          {t('pump_status_headline')}
        </div>
        <div className="collapse-content px-0 pt-0">
          <div className="flex flex-col divide-y divide-base-200">
            {/* Pumps Summary */}
            <div className="p-4">
              <h3 className="font-medium mb-3 text-base-content/70 text-sm">
                {t('pump_status_pumps_headline')}
              </h3>
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-sm">{t('pump_status_pumps_installed')}</div>
                <div className="text-right">
                  <span className="badge badge-primary">{nrPumps}</span>
                </div>
                <div className="text-sm">{t('pump_status_pumps_ingredients_installed')}</div>
                <div className="text-right">
                  <span className="badge badge-primary">{nrIngredientsInstalled}</span>
                </div>
              </div>
            </div>

            {/* Reverse Pumping Status */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-base-content/70 text-sm">
                  {t('pump_status_reverse_pumping_headline')}
                </h3>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => navigate('/reversepumpsettings')}
                  title={t('common.edit')}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-sm">{t('pump_status_reverse_pumping')}</div>
                <div className="text-right">
                  <span className={`badge ${reversePumpSettings?.enable ? 'badge-success' : 'badge-error'}`}>
                    {reversePumpingStatus}
                  </span>
                </div>
                {reversePumpSettings?.enable && (
                  <>
                    <div className="text-sm">{t('pump_status_reverse_pumping_overshoot')}</div>
                    <div className="text-right">
                      <span className="badge badge-ghost">
                        {reversePumpSettings?.settings?.overshoot || 0}%
                      </span>
                    </div>
                    <div className="text-sm">{t('pump_status_reverse_pumping_timer')}</div>
                    <div className="text-right">
                      <span className="badge badge-ghost">
                        {reversePumpSettings?.settings?.autoPumpBackTimer || 0} min
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Load Cell Status */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-base-content/70 text-sm">
                  {t('pump_status_load_cell_headline')}
                </h3>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => navigate('/loadcellsettings')}
                  title={t('common.edit')}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-sm">{t('pump_status_load_cell_status')}</div>
                <div className="text-right">
                  <span className={`badge ${loadCellSettings?.enable ? 'badge-success' : 'badge-error'}`}>
                    {loadCellStatus}
                  </span>
                </div>
                {loadCellSettings?.enable && (
                  <>
                    <div className="text-sm">{t('pump_status_load_cell_calibrated')}</div>
                    <div className="text-right">
                      <span className={`badge ${loadCellSettings?.calibrated ? 'badge-success' : 'badge-error'}`}>
                        {loadCellCalibrated}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PumpStatus;
