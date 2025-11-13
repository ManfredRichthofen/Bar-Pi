import React, { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../../../store/authStore';
import { usePumpStore } from '../../../store/pumpStore';
import PumpService from '../../../services/pump.service';
import PumpStatus from './components/pumpStatus.jsx';
import PumpCard from './components/pumpCard.jsx';
import PumpSetupTypeSelector from './components/pumpSelector';
import { PlusCircle, PlayCircle, StopCircle, AlertCircle } from 'lucide-react';

const Pumps = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const token = useAuthStore((state) => state.token);

  const { pumps, isAllowReversePumping, loading, error, fetchPumps } =
    usePumpStore();

  useEffect(() => {
    if (token) {
      fetchPumps(token);
    }
  }, [token]);

  const showToast = (message, type = 'error') => {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast toast-bottom toast-end z-50';

    const alert = document.createElement('div');
    alert.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`;

    const content = document.createElement('div');
    content.className = 'flex items-center gap-2';

    // Add icon based on type
    const icon = document.createElement('span');
    if (type === 'success') {
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>`;
    } else {
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>`;
    }

    const text = document.createElement('span');
    text.textContent = message;
    text.className = 'font-medium break-words';

    content.appendChild(icon);
    content.appendChild(text);
    alert.appendChild(content);
    toastContainer.appendChild(alert);
    document.body.appendChild(toastContainer);

    // Add entrance animation
    toastContainer.style.opacity = '0';
    toastContainer.style.transform = 'translateY(-1rem)';
    toastContainer.style.transition = 'all 0.3s ease-in-out';

    setTimeout(() => {
      toastContainer.style.opacity = '1';
      toastContainer.style.transform = 'translateY(0)';
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toastContainer.style.opacity = '0';
      toastContainer.style.transform = 'translateY(-1rem)';
      setTimeout(() => {
        if (document.body.contains(toastContainer)) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    }, 3000);
  };

  const onClickTurnOnAllPumps = () => {
    PumpService.startPump(null, token)
      .then(() => {
        showToast('All pumps started successfully', 'success');
      })
      .catch((err) => {
        showToast('Failed to start pumps');
        console.error(err);
      });
  };

  const onClickTurnOffAllPumps = () => {
    PumpService.stopPump(null, token)
      .then(() => {
        showToast('All pumps stopped successfully', 'success');
      })
      .catch((err) => {
        showToast('Failed to stop pumps');
        console.error(err);
      });
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-base-100/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Pump Management</h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddDialog(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Pump
              </button>
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={onClickTurnOnAllPumps}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Start All
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm"
                onClick={onClickTurnOffAllPumps}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-6 shadow-lg">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <span className="font-medium break-words">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pump Status Sidebar */}
            <div className="lg:col-span-3">
              <PumpStatus />
            </div>

            {/* Pump Cards Grid */}
            <div className="lg:col-span-9">
              {pumps && pumps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                  {pumps.map((pump) => (
                    <div key={pump.id} className="w-full">
                      <PumpCard pump={pump} showDetailed={true} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="text-base-content/40 mb-4">
                    <AlertCircle className="h-16 w-16" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Pumps Found</h3>
                  <p className="text-base-content/60 text-center text-sm mb-4">
                    Get started by adding your first pump
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add First Pump
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Pump Dialog */}
      {showAddDialog && (
        <PumpSetupTypeSelector
          show={showAddDialog}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
};

export default Pumps;
