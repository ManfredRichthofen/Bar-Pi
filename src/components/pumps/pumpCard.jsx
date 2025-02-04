// CPumpCard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  PlayCircle,
  StopCircle,
  CornerUpLeft,
  CornerUpRight,
  Droplet,
  Hexagon,
} from 'lucide-react';

import WebSocketService from '../../services/websocket.service';
import PumpService from '../../services/pump.service';
import useAuthStore from '../../store/authStore';

// Updated toast helper using DaisyUI classes
const showToast = (message, type = 'success') => {
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast toast-top toast-end z-50';

  const alert = document.createElement('div');
  alert.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;

  const content = document.createElement('div');
  content.className = 'flex items-center gap-2';
  
  // Add icon based on type
  const icon = document.createElement('span');
  if (type === 'success') {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>`;
  } else {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
    </svg>`;
  }

  const text = document.createElement('span');
  text.textContent = message;

  content.appendChild(icon);
  content.appendChild(text);
  alert.appendChild(content);
  toastContainer.appendChild(alert);
  document.body.appendChild(toastContainer);

  // Animate in
  setTimeout(() => {
    toastContainer.style.opacity = '1';
    toastContainer.style.transform = 'translateY(0)';
  }, 100);

  // Remove after delay
  setTimeout(() => {
    toastContainer.style.opacity = '0';
    toastContainer.style.transform = 'translateY(-1rem)';
    setTimeout(() => {
      document.body.removeChild(toastContainer);
    }, 300);
  }, 3000);
};

// You might want to create a custom StepperMotorIcon component
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

const CPumpCard = ({ pump, showDetailed = false }) => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // Local loading states
  const [pumpDownBtnLoading, setPumpDownBtnLoading] = useState(false);
  const [pumpUpBtnLoading, setPumpUpBtnLoading] = useState(false);
  const [runningBtnLoading, setRunningBtnLoading] = useState(false);
  const [pumpJobState, setPumpJobState] = useState({
    lastJobId: null,
    runningState: null
  });

  // Subscribe to WebSocket updates when pump changes
  useEffect(() => {
    const topic = `/user/topic/pump/runningstate/${pump.id}`;
    // Subscribe with a callback that parses the incoming data
    WebSocketService.subscribe(topic, (data) => {
      try {
        const parsed = JSON.parse(data.body);
        setPumpJobState(parsed);
      } catch (err) {
        console.error('Error parsing pump job state', err);
      }
    }, true);

    // Cleanup subscription on unmount or when pump.id changes
    return () => {
      WebSocketService.unsubscribe(topic);
    };
  }, [pump.id]);

  // --- Helper functions for display attributes ---
  const getDisplayAttribute = (attr, suffix = '') => {
    const missingText = 'Missing'; // Replace with t('component.pump_card.option_missing') if needed
    if ((attr === undefined || attr === null) && attr !== 0) {
      return { className: 'text-red-500', label: missingText };
    } else {
      return { className: 'text-inherit', label: `${attr}${suffix ? ' ' + suffix : ''}` };
    }
  };

  const getDisplayPin = (pin) => {
    const missingText = 'Missing';
    if (!pin) {
      return { className: 'text-red-500', label: missingText };
    } else {
      return { className: 'text-inherit', label: `${pin.boardName} / ${pin.pinName}` };
    }
  };

  // --- Computed Values (converted from Vue computed) ---
  const displayName = pump.name || `Pump #${pump.id}`; // fallback text

  const printPumpType = (() => {
    switch (pump.type) {
      case 'dc':
        return 'DC Pump'; // Replace with translation if needed
      case 'stepper':
        return 'Stepper Pump';
      case 'valve':
        return 'Valve';
      default:
        return '';
    }
  })();

  // For the pump header icons
  const PumpTypeIcon = (() => {
    if (pump.type === 'dc') {
      return <Droplet size={16} className="inline-block mr-1" />;
    } else if (pump.type === 'stepper') {
      return <StepperMotorIcon width={16} height={16} className="inline-block mr-1" />;
    } else {
      return <Hexagon size={16} className="inline-block mr-1" />;
    }
  })();

  // progressBar computation (simulate q-linear-progress)
  const progressBar = (() => {
    const abortVal = { value: pump.pumpedUp ? 1 : 0, query: false, reverse: false };
    if (!pumpJobState.runningState) {
      return abortVal;
    }
    const runningState = pumpJobState.runningState;
    let value = runningState.forward
      ? runningState.percentage
      : (100 - runningState.percentage);
    value = value / 100;
    return {
      value,
      query: runningState.runInfinity,
      reverse: runningState.forward && runningState.runInfinity
    };
  })();

  const printIngredient = pump.currentIngredient
    ? pump.currentIngredient.name
    : 'No ingredient assigned'; // or translation

  const pumpedUpState = (() => {
    if (pump.pumpedUp) {
      return { color: 'bg-green-500', label: 'Pumped Up' };
    } else {
      return { color: 'bg-red-500', label: 'Pumped Down' };
    }
  })();

  const pumpState = (() => {
    // Default state based on pump.state
    let state = { color: '', label: '' };
    if (pumpJobState.runningState) {
      state = { color: 'bg-green-500', label: 'Running' };
    } else {
      switch (pump.state) {
        case 'READY':
          state = { color: 'bg-green-500', label: 'Ready' };
          break;
        case 'INCOMPLETE':
        case 'TESTABLE':
          state = { color: 'bg-red-500', label: 'Incomplete' };
          break;
        default:
          state = { color: '', label: pump.state };
      }
    }
    return state;
  })();

  // --- Event Handlers ---
  const onClickTurnOnOrOffPump = () => {
    setRunningBtnLoading(true);
    if (pumpJobState.runningState) {
      PumpService.stopPump(pump.id, token)
        .then(() => {
          showToast(`Pump "${displayName}" stopped successfully`);
        })
        .catch(() => {
          showToast(`Failed to stop pump "${displayName}"`, 'error');
        })
        .finally(() => setRunningBtnLoading(false));
    } else {
      PumpService.startPump(pump.id, token)
        .then(() => {
          showToast(`Pump "${displayName}" started successfully`);
        })
        .catch(() => {
          showToast(`Failed to start pump "${displayName}"`, 'error');
        })
        .finally(() => setRunningBtnLoading(false));
    }
  };

  const onClickPumpUp = (reverse) => {
    if (reverse) {
      setPumpDownBtnLoading(true);
      PumpService.pumpDown(pump.id, token)
        .finally(() => setPumpDownBtnLoading(false));
    } else {
      setPumpUpBtnLoading(true);
      PumpService.pumpUp(pump.id, token)
        .finally(() => setPumpUpBtnLoading(false));
    }
  };

  // --- Render ---
  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="card-body p-4 bg-base-200 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title text-lg">{displayName}</h3>
            <p className="text-sm text-base-content/70 flex items-center">
              {PumpTypeIcon}
              {printPumpType}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => navigate(`/editpump/${pump.id}`)}
              className="btn btn-ghost btn-sm px-2"
              title="Edit Pump"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <span className={`badge ${pumpedUpState.color} badge-sm`}>
              {pumpedUpState.label}
            </span>
            <span className={`badge ${pumpState.color} badge-sm`}>
              {pumpState.label}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {progressBar.query ? (
        <progress className="progress progress-primary w-full"></progress>
      ) : (
        <progress
          className="progress progress-primary w-full"
          value={progressBar.value * 100}
          max="100"
        ></progress>
      )}

      {/* Basic Info */}
      <div className="card-body p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-base-content/70">Ingredient</div>
          <div className="text-right font-medium">{printIngredient}</div>
          <div className="text-base-content/70">Filling Level</div>
          <div className="text-right font-medium">
            {getDisplayAttribute(pump.fillingLevelInMl, 'ml').label}
          </div>
        </div>

        {/* Detailed Info */}
        {showDetailed && (
          <>
            <div className="divider my-2"></div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* ... detailed info fields ... */}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="card-actions justify-end mt-4">
          <div className="join">
            {pump.canControlDirection && (
              <>
                <button
                  onClick={() => onClickPumpUp(true)}
                  disabled={!!pumpJobState.runningState}
                  className={`btn btn-sm join-item ${pumpDownBtnLoading ? 'loading' : ''}`}
                  title="Pump Down"
                >
                  <CornerUpLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onClickPumpUp(false)}
                  disabled={!!pumpJobState.runningState}
                  className={`btn btn-sm join-item ${pumpUpBtnLoading ? 'loading' : ''}`}
                  title="Pump Up"
                >
                  <CornerUpRight className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={onClickTurnOnOrOffPump}
              disabled={runningBtnLoading}
              className={`btn btn-sm join-item ${runningBtnLoading ? 'loading' : ''}`}
              title={pumpJobState.runningState ? 'Stop Pump' : 'Start Pump'}
            >
              {pumpJobState.runningState ? 
                <StopCircle className="h-4 w-4" /> : 
                <PlayCircle className="h-4 w-4" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPumpCard;
