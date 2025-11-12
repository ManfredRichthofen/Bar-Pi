import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Droplet,
  Hexagon,
  Settings,
  Zap,
  Timer,
  Package,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../../../store/authStore';
import { usePumpStore } from '../../../../store/pumpStore';
import PumpService from '../../../../services/pump.service';
import IngredientService from '../../../../services/ingredient.service';
import GpioService from '../../../../services/gpio.service';

// Stepper Motor Icon Component
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

const AddPumpModal = ({ show, onClose, pumpType = null }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const { addPump } = usePumpStore();

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      type: pumpType || 'dc',
      pin: null,
      enablePin: null,
      stepPin: null,
      timePerClInMs: 1000,
      isPowerStateHigh: false,
      tubeCapacityInMl: 100,
      fillingLevelInMl: 0,
      isPumpedUp: false,
      currentIngredientId: null,
      acceleration: 1000,
      maxStepsPerSecond: 2000,
      stepsPerCl: 100,
    },
  });

  // Component state
  const [ingredients, setIngredients] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Watch form values for conditional rendering
  const pumpTypeValue = watch('type');

  // Load data when modal opens
  useEffect(() => {
    if (show && token) {
      loadData();
    }
  }, [show, token]);

  // Reset form when pump type changes
  useEffect(() => {
    if (pumpType) {
      setValue('type', pumpType);
    }
  }, [pumpType, setValue]);

  // Load ingredients and boards
  const loadData = async () => {
    try {
      setLoading(true);
      const [ingredientsData, boardsData] = await Promise.all([
        IngredientService.getIngredients(token),
        GpioService.getBoards(token),
      ]);

      setIngredients(ingredientsData);
      setBoards(boardsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast toast-top toast-end z-50';

    const alert = document.createElement('div');
    alert.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;

    const content = document.createElement('div');
    content.className = 'flex items-center gap-2';

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

    setTimeout(() => {
      toastContainer.style.opacity = '1';
      toastContainer.style.transform = 'translateY(0)';
    }, 100);

    setTimeout(() => {
      toastContainer.style.opacity = '0';
      toastContainer.style.transform = 'translateY(-1rem)';
      setTimeout(() => {
        document.body.removeChild(toastContainer);
      }, 300);
    }, 3000);
  };

  // Handle form submission
  const onSubmit = async (data) => {
    if (!token) return;

    try {
      setSaving(true);
      setError(null);

      // Create pump via API
      const response = await PumpService.createPump(data, token);
      const newPump = response.data;

      // Add to local store
      addPump(newPump);

      setSuccess('Pump created successfully');
      showToast('Pump created successfully', 'success');

      // Reset form
      reset();

      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating pump:', err);
      setError('Failed to create pump');
      showToast('Failed to create pump', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!saving && onClose) {
      reset();
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  // Get pump type icon
  const getPumpTypeIcon = (type) => {
    switch (type) {
      case 'dc':
        return <Droplet size={20} />;
      case 'stepper':
        return <StepperMotorIcon width={20} height={20} />;
      case 'valve':
        return <Hexagon size={20} />;
      default:
        return <Settings size={20} />;
    }
  };

  // Get pump type name
  const getPumpTypeName = (type) => {
    switch (type) {
      case 'dc':
        return 'DC Pump';
      case 'stepper':
        return 'Stepper Motor';
      case 'valve':
        return 'Control Valve';
      default:
        return 'Unknown';
    }
  };

  if (!show) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box w-full max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {getPumpTypeIcon(pumpTypeValue)}
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">Add New Pump</h3>
              <p className="text-sm text-base-content/70">
                {getPumpTypeName(pumpTypeValue)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success mb-4">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium break-words">{success}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium break-words">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        )}

        {/* Form */}
        {!loading && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h4 className="card-title text-base mb-4">
                    Basic Information
                  </h4>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Pump Name</span>
                    </label>
                    <input
                      type="text"
                      className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                      placeholder="Enter pump name"
                      {...register('name', {
                        required: 'Pump name is required',
                      })}
                    />
                    {errors.name && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.name.message}
                        </span>
                      </label>
                    )}
                  </div>

                  {!pumpType && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          Pump Type
                        </span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        {...register('type')}
                      >
                        <option value="dc">DC Pump</option>
                        <option value="stepper">Stepper Motor</option>
                        <option value="valve">Control Valve</option>
                      </select>
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Current Ingredient
                      </span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      {...register('currentIngredientId')}
                    >
                      <option value="">No ingredient assigned</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Hardware Configuration */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h4 className="card-title text-base mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Hardware Configuration
                  </h4>

                  {/* DC Pump / Valve Pin */}
                  {(pumpTypeValue === 'dc' || pumpTypeValue === 'valve') && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          Control Pin
                        </span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        {...register('pin.boardId')}
                      >
                        <option value="">Select board</option>
                        {boards.map((board) => (
                          <option key={board.id} value={board.id}>
                            {board.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Stepper Motor Pins */}
                  {pumpTypeValue === 'stepper' && (
                    <>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            Enable Pin
                          </span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...register('enablePin.boardId')}
                        >
                          <option value="">Select board</option>
                          {boards.map((board) => (
                            <option key={board.id} value={board.id}>
                              {board.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            Step Pin
                          </span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...register('stepPin.boardId')}
                        >
                          <option value="">Select board</option>
                          {boards.map((board) => (
                            <option key={board.id} value={board.id}>
                              {board.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text font-medium">
                        Power State High
                      </span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        {...register('isPowerStateHigh')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Timing Configuration */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h4 className="card-title text-base mb-4 flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Timing Configuration
                  </h4>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Time per CL (ms)
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      placeholder="1000"
                      {...register('timePerClInMs', {
                        min: { value: 1, message: 'Must be at least 1ms' },
                        required: 'Time per CL is required',
                      })}
                    />
                    {errors.timePerClInMs && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.timePerClInMs.message}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Stepper-specific timing */}
                  {pumpTypeValue === 'stepper' && (
                    <>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            Acceleration
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered w-full"
                          placeholder="1000"
                          {...register('acceleration', {
                            min: { value: 1, message: 'Must be at least 1' },
                          })}
                        />
                        {errors.acceleration && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {errors.acceleration.message}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            Max Steps per Second
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered w-full"
                          placeholder="2000"
                          {...register('maxStepsPerSecond', {
                            min: { value: 1, message: 'Must be at least 1' },
                          })}
                        />
                        {errors.maxStepsPerSecond && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {errors.maxStepsPerSecond.message}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            Steps per CL
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered w-full"
                          placeholder="100"
                          {...register('stepsPerCl', {
                            min: { value: 1, message: 'Must be at least 1' },
                          })}
                        />
                        {errors.stepsPerCl && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {errors.stepsPerCl.message}
                            </span>
                          </label>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Capacity Configuration */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h4 className="card-title text-base mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Capacity Configuration
                  </h4>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Tube Capacity (ml)
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      placeholder="100"
                      {...register('tubeCapacityInMl', {
                        min: { value: 0, message: 'Must be at least 0' },
                        required: 'Tube capacity is required',
                      })}
                    />
                    {errors.tubeCapacityInMl && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.tubeCapacityInMl.message}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Filling Level (ml)
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      placeholder="0"
                      {...register('fillingLevelInMl', {
                        min: { value: 0, message: 'Must be at least 0' },
                      })}
                    />
                    {errors.fillingLevelInMl && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.fillingLevelInMl.message}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text font-medium">Pumped Up</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        {...register('isPumpedUp')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-base-300">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <div className="loading loading-spinner loading-sm"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="ml-2">Create Pump</span>
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </dialog>
  );
};

export default AddPumpModal;
