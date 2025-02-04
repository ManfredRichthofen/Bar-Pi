import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Droplet, Hexagon } from 'lucide-react';

import PumpService from '../../services/pump.service';
import useAuthStore from '../../store/authStore';

// Add StepperMotorIcon component
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

/**
 * Props:
 * - show (Boolean): whether the modal is open.
 * - onClose (Function): callback to request closing the modal.
 */
const PumpSelector = ({ show, onClose }) => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const { t } = useTranslation();
  const [stepperLoading, setStepperLoading] = useState(false);
  const [valveLoading, setValveLoading] = useState(false);
  const [dcLoading, setDcLoading] = useState(false);

  // A computed "loading" flag
  const loading = stepperLoading || valveLoading || dcLoading;

  const onClickAddPump = (type) => {
    if (loading) return;

    // Set loading state
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
      .then((response) => {
        navigate(`/editpump/${response.data.id}`);
      })
      .catch((error) => {
        console.error('Error creating pump:', error);
      })
      .finally(() => {
        setStepperLoading(false);
        setValveLoading(false);
        setDcLoading(false);
      });
  };

  // Prevent closing the modal while loading
  const handleClose = () => {
    if (!loading && onClose) {
      onClose(false);
    }
  };

  // Close the modal when show becomes false
  useEffect(() => {
    if (!show) {
      // Reset any loading state if the modal is closed externally.
      setStepperLoading(false);
      setValveLoading(false);
      setDcLoading(false);
    }
  }, [show]);

  if (!show) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box w-full max-w-2xl">
        <div className="text-center mb-8">
          <h5 className="text-xl font-semibold">
            {t('pump_selector.headline')}
          </h5>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {/* Valve Card */}
          <div className="w-1/3">
            <div
              className={`card cursor-pointer hover:shadow-lg transition ${
                loading ? 'opacity-50 pointer-events-none' : ''
              }`}
              onClick={() => onClickAddPump('valve')}
            >
              <div className="card-body flex flex-col items-center justify-center">
                {valveLoading ? (
                  <Loader2 className="animate-spin mb-2" size={32} />
                ) : (
                  <Hexagon size={32} className="mb-2" />
                )}
                <p className="font-bold">{t('pump_selector.valve')}</p>
              </div>
            </div>
          </div>

          {/* DC Pump Card */}
          <div className="w-1/3">
            <div
              className={`card cursor-pointer hover:shadow-lg transition ${
                loading ? 'opacity-50 pointer-events-none' : ''
              }`}
              onClick={() => onClickAddPump('dc')}
            >
              <div className="card-body flex flex-col items-center justify-center">
                {dcLoading ? (
                  <Loader2 className="animate-spin mb-2" size={32} />
                ) : (
                  <Droplet size={32} className="mb-2" />
                )}
                <p className="font-bold">{t('pump_selector.dc_pump')}</p>
              </div>
            </div>
          </div>

          {/* Stepper Pump Card */}
          <div className="w-1/3">
            <div
              className={`card cursor-pointer hover:shadow-lg transition ${
                loading ? 'opacity-50 pointer-events-none' : ''
              }`}
              onClick={() => onClickAddPump('stepper')}
            >
              <div className="card-body flex flex-col items-center justify-center">
                {stepperLoading ? (
                  <Loader2 className="animate-spin mb-2" size={32} />
                ) : (
                  <StepperMotorIcon width={32} height={32} className="mb-2" />
                )}
                <p className="font-bold">{t('pump_selector.stepper_pump')}</p>
              </div>
            </div>
          </div>
        </div>

        {!loading && (
          <div className="modal-action">
            <button className="btn btn-secondary" onClick={handleClose}>
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </dialog>
  );
};

export default PumpSelector;
