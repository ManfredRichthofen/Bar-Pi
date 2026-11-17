import { useNavigate } from '@tanstack/react-router';
import { Cpu, Droplet, Hexagon, Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StepperMotorIcon } from '@/pages/AdvancedMode/PumpsPage/components/StepperMotorIcon';
import PumpService from '../../../../services/pump.service';
import useAuthStore from '../../../../store/authStore';

interface PumpSelectorProps {
  show: boolean;
  onClose: () => void;
}

export const PumpSelector: React.FC<PumpSelectorProps> = ({
  show,
  onClose,
}) => {
  const navigate = useNavigate({ from: '/pumps' });
  const token = useAuthStore((state) => state.token);
  const { t } = useTranslation();
  const [stepperLoading, setStepperLoading] = useState(false);
  const [valveLoading, setValveLoading] = useState(false);
  const [dcLoading, setDcLoading] = useState(false);
  const [virtualLoading, setVirtualLoading] = useState(false);

  const loading = stepperLoading || valveLoading || dcLoading || virtualLoading;

  const onClickAddPump = (type: 'dc' | 'valve' | 'stepper' | 'virtual') => {
    if (loading) return;

    switch (type) {
      case 'dc':
        setDcLoading(true);
        break;
      case 'valve':
        setValveLoading(true);
        break;
      case 'stepper':
        setStepperLoading(true);
        break;
      case 'virtual':
        setVirtualLoading(true);
        break;
      default:
        throw new Error(`Unknown pump type: ${type}`);
    }

    const newPump = { type };

    PumpService.createPump(newPump, token)
      .then((response: any) => {
        navigate({ to: `/pumps/${response.data.id}/edit` });
      })
      .catch((error: any) => {
        console.error('Error creating pump:', error);
      })
      .finally(() => {
        setStepperLoading(false);
        setValveLoading(false);
        setDcLoading(false);
        setVirtualLoading(false);
      });
  };

  const handleClose = () => {
    if (!loading && onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (!show) {
      setStepperLoading(false);
      setValveLoading(false);
      setDcLoading(false);
      setVirtualLoading(false);
    }
  }, [show]);

  return (
    <Dialog
      open={show}
      onOpenChange={(open: boolean) => !open && handleClose()}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('pump_selector.headline')}
          </DialogTitle>
        </DialogHeader>

        <div className="block sm:hidden space-y-4">
          <Card
            className={`cursor-pointer hover:shadow-lg transition-colors ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => onClickAddPump('virtual')}
          >
            <CardContent className="p-6 flex flex-row items-center justify-start gap-4">
              {virtualLoading ? (
                <Loader2 className="animate-spin" size={32} />
              ) : (
                <Cpu size={32} />
              )}
              <div className="flex-1">
                <p className="font-bold text-lg">
                  {t('pump_selector.virtual', 'Virtual Pump')}
                </p>
                <p className="text-sm text-foreground-muted">
                  {t(
                    'pump_selector.virtual_description',
                    'No hardware, for testing',
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-colors ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => onClickAddPump('valve')}
          >
            <CardContent className="p-6 flex flex-row items-center justify-start gap-4">
              {valveLoading ? (
                <Loader2 className="animate-spin" size={32} />
              ) : (
                <Hexagon size={32} />
              )}
              <div className="flex-1">
                <p className="font-bold text-lg">{t('pump_selector.valve')}</p>
                <p className="text-sm text-foreground-muted">
                  {t('pump_selector.valve_description')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-colors ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => onClickAddPump('dc')}
          >
            <CardContent className="p-6 flex flex-row items-center justify-start gap-4">
              {dcLoading ? (
                <Loader2 className="animate-spin" size={32} />
              ) : (
                <Droplet size={32} />
              )}
              <div className="flex-1">
                <p className="font-bold text-lg">
                  {t('pump_selector.dc_pump')}
                </p>
                <p className="text-sm text-foreground-muted">
                  {t('pump_selector.dc_pump_description')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-colors ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => onClickAddPump('stepper')}
          >
            <CardContent className="p-6 flex flex-row items-center justify-start gap-4">
              {stepperLoading ? (
                <Loader2 className="animate-spin" size={32} />
              ) : (
                <StepperMotorIcon width={32} height={32} />
              )}
              <div className="flex-1">
                <p className="font-bold text-lg">
                  {t('pump_selector.stepper_pump')}
                </p>
                <p className="text-sm text-foreground-muted">
                  {t('pump_selector.stepper_pump_description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden sm:grid sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <Card
            className={`cursor-pointer hover:shadow-lg transition-colors ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => onClickAddPump('virtual')}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6">
              {virtualLoading ? (
                <Loader2 className="animate-spin mb-3 sm:mb-4" size={40} />
              ) : (
                <Cpu size={40} className="mb-3 sm:mb-4" />
              )}
              <p className="font-bold text-center text-base sm:text-lg">
                {t('pump_selector.virtual', 'Virtual Pump')}
              </p>
              <p className="text-sm sm:text-sm text-foreground-muted text-center mt-1">
                {t(
                  'pump_selector.virtual_description',
                  'No hardware, for testing',
                )}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-colors ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => onClickAddPump('valve')}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6">
              {valveLoading ? (
                <Loader2 className="animate-spin mb-3 sm:mb-4" size={40} />
              ) : (
                <Hexagon size={40} className="mb-3 sm:mb-4" />
              )}
              <p className="font-bold text-center text-base sm:text-lg">
                {t('pump_selector.valve')}
              </p>
              <p className="text-sm sm:text-sm text-foreground-muted text-center mt-1">
                {t('pump_selector.valve_description')}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-colors ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => onClickAddPump('dc')}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6">
              {dcLoading ? (
                <Loader2 className="animate-spin mb-3 sm:mb-4" size={40} />
              ) : (
                <Droplet size={40} className="mb-3 sm:mb-4" />
              )}
              <p className="font-bold text-center text-base sm:text-lg">
                {t('pump_selector.dc_pump')}
              </p>
              <p className="text-sm sm:text-sm text-foreground-muted text-center mt-1">
                {t('pump_selector.dc_pump_description')}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-colors ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => onClickAddPump('stepper')}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6">
              {stepperLoading ? (
                <Loader2 className="animate-spin mb-3 sm:mb-4" size={40} />
              ) : (
                <StepperMotorIcon
                  width={40}
                  height={40}
                  className="mb-3 sm:mb-4"
                />
              )}
              <p className="font-bold text-center text-base sm:text-lg">
                {t('pump_selector.stepper_pump')}
              </p>
              <p className="text-sm sm:text-sm text-foreground-muted text-center mt-1">
                {t('pump_selector.stepper_pump_description')}
              </p>
            </CardContent>
          </Card>
        </div>

        {!loading && (
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
