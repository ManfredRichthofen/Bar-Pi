import React, { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import { usePumpStore } from '../store/pumpStore';
import PumpService from '../services/pump.service';
import PumpStatus from '../components/pumps/pumpStatus';
import PumpCard from '../components/pumps/pumpCard';
import PumpSetupTypeSelector from '../components/pumps/pumpSelector';

// Import Lucide icons
import { 
  PlusCircle, 
  PlayCircle, 
  StopCircle, 
  AlertCircle 
} from 'lucide-react';

const Pumps = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const token = useAuthStore((state) => state.token);
  
  const {
    pumps,
    isAllowReversePumping,
    loading,
    error,
    fetchPumps
  } = usePumpStore();

  // Fetch pumps on component mount
  useEffect(() => {
    if (token) {
      fetchPumps(token);
    }
  }, [token]);

  // Updated toast helper
  const showToast = (message, type = 'error') => {
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

  // Handler for turning on all pumps
  const onClickTurnOnAllPumps = () => {
    // Pass token if your PumpService requires it
    PumpService.startPump(null, token)
      .then(() => {
        showToast(
          'All pumps started successfully',
          'success'
        );
      })
      .catch((err) => {
        showToast('Failed to start pumps');
        console.error(err);
      });
  };

  // Handler for turning off all pumps
  const onClickTurnOffAllPumps = () => {
    PumpService.stopPump(null, token)
      .then(() => {
        showToast(
          'All pumps stopped successfully',
          'success'
        );
      })
      .catch((err) => {
        showToast('Failed to stop pumps');
        console.error(err);
      });
  };

  return (
    <div className="p-6">
      {/* Loading Spinner */}
      {loading && (
        <div className="fixed inset-0 bg-base-100/50 flex justify-center items-center z-50">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="h-6 w-6" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pump Management</h2>
        
        {/* Action Buttons */}
        <div className="join">
          <button
            type="button"
            className="btn btn-primary join-item"
            onClick={() => setShowAddDialog(true)}
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Pump
          </button>
          <button
            type="button"
            className="btn btn-success join-item"
            onClick={onClickTurnOnAllPumps}
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            Start All
          </button>
          <button
            type="button"
            className="btn btn-error join-item"
            onClick={onClickTurnOffAllPumps}
          >
            <StopCircle className="h-5 w-5 mr-2" />
            Stop All
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pump Status */}
        <div className="lg:col-span-3">
          <PumpStatus />
        </div>

        {/* Right Column: Pump Cards */}
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pumps && pumps.length > 0 ? (
              pumps.map((pump) => (
                <div key={pump.id} className="w-full">
                  <PumpCard pump={pump} showDetailed />
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="card bg-base-200">
                  <div className="card-body flex-row items-center justify-center text-base-content/70">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <p>No pumps found</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pump Setup Type Selector Dialog */}
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
