import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Loader2, Droplet, Hexagon } from 'lucide-react';
import PumpService from '../../../../services/pump.service';
import useAuthStore from '../../../../store/authStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const StepperMotorIcon = ({ width = 24, height = 24, className = '' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12" />
    <path d="M8 10l8 4" />
    <path d="M16 10l-8 4" />
  </svg>
);

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

  const loading = stepperLoading || valveLoading || dcLoading;

  const onClickAddPump = (type: 'dc' | 'valve' | 'stepper') => {
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
            className={`cursor-pointer hover:shadow-lg transition-all ${
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
                <p className="text-sm text-muted-foreground">
                  Control valve for precise flow
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
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
                <p className="text-sm text-muted-foreground">
                  DC motor pump for continuous flow
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
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
                <p className="text-sm text-muted-foreground">
                  Stepper motor for precise control
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden sm:grid sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
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
              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-1">
                Control valve for precise flow
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
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
              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-1">
                DC motor pump for continuous flow
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
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
              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-1">
                Stepper motor for precise control
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
