import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
  Droplet,
  Hexagon,
  Settings,
  Zap,
  Thermometer,
  Timer,
  Package,
  TestTube,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../../store/authStore';
import { usePumpStore } from '../../../store/pumpStore';
import PumpService from '../../../services/pump.service';
import IngredientService from '../../../services/ingredient.service';
import GpioService from '../../../services/gpio.service';

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

const EditPumpPage = () => {
  const { pumpId } = useParams({ from: '/pumps/$pumpId/edit' });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const { updatePump, removePump } = usePumpStore();

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      type: 'dc',
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
  const [pump, setPump] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Watch form values for conditional rendering
  const pumpType = watch('type');
  const selectedBoardId = watch('pin.boardId');

  // Load pump data
  useEffect(() => {
    const loadPumpData = async () => {
      if (!token || !pumpId) return;

      try {
        setLoading(true);
        const [pumpData, ingredientsData, boardsData] = await Promise.all([
          PumpService.getPump(pumpId, token),
          IngredientService.getIngredients(token),
          GpioService.getBoards(token),
        ]);

        setPump(pumpData);
        setIngredients(ingredientsData);
        setBoards(boardsData);

        // Populate form with pump data
        setValue('name', pumpData.name || '');
        setValue('type', pumpData.type || 'dc');
        setValue('pin', pumpData.pin || null);
        setValue('enablePin', pumpData.enablePin || null);
        setValue('stepPin', pumpData.stepPin || null);
        setValue('timePerClInMs', pumpData.timePerClInMs || 1000);
        setValue('isPowerStateHigh', pumpData.isPowerStateHigh || false);
        setValue('tubeCapacityInMl', pumpData.tubeCapacityInMl || 100);
        setValue('fillingLevelInMl', pumpData.fillingLevelInMl || 0);
        setValue('isPumpedUp', pumpData.isPumpedUp || false);
        setValue('currentIngredientId', pumpData.currentIngredient?.id || null);
        setValue('acceleration', pumpData.acceleration || 1000);
        setValue('maxStepsPerSecond', pumpData.maxStepsPerSecond || 2000);
        setValue('stepsPerCl', pumpData.stepsPerCl || 100);
      } catch (err) {
        console.error('Error loading pump data:', err);
        setError('Failed to load pump data');
      } finally {
        setLoading(false);
      }
    };

    loadPumpData();
  }, [pumpId, token, setValue]);

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
    if (!token || !pumpId) return;

    try {
      setSaving(true);
      setError(null);

      // Prepare pump data for API
      const pumpData = {
        ...data,
        removeFields: [],
      };

      // Update pump via API
      const updatedPump = await PumpService.patchPump(pumpId, pumpData, token);

      // Update local store
      updatePump(pumpId, updatedPump);

      setSuccess('Pump updated successfully');
      showToast('Pump updated successfully', 'success');

      // Navigate back after a short delay
      setTimeout(() => {
        navigate({ to: '/pumps' });
      }, 1500);
    } catch (err) {
      console.error('Error updating pump:', err);
      setError('Failed to update pump');
      showToast('Failed to update pump', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle pump deletion
  const handleDelete = async () => {
    if (!token || !pumpId) return;

    if (
      !confirm(
        'Are you sure you want to delete this pump? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await PumpService.deletePump(pumpId, token);

      // Update local store
      removePump(pumpId);

      showToast('Pump deleted successfully', 'success');

      // Navigate back
      navigate({ to: '/pumps' });
    } catch (err) {
      console.error('Error deleting pump:', err);
      setError('Failed to delete pump');
      showToast('Failed to delete pump', 'error');
    } finally {
      setDeleting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!pump) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pump Not Found</h2>
          <p className="text-base-content/70 mb-4">
            The pump you're looking for doesn't exist.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate({ to: '/pumps' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pumps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/pumps' })}
              className="btn btn-ghost btn-sm"
              title="Back to Pumps"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-base-content break-words">
                Edit Pump
              </h1>
              <p className="text-sm text-base-content/70 flex items-center gap-2">
                {getPumpTypeIcon(pump.type)}
                {getPumpTypeName(pump.type)}
                {pump.name && (
                  <>
                    <span>•</span>
                    <span>{pump.name}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn btn-error btn-sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <div className="loading loading-spinner loading-xs"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-2">Delete</span>
            </button>
            <button
              type="submit"
              form="pump-form"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? (
                <div className="loading loading-spinner loading-xs"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-2">Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success mx-4 mt-4 shadow-lg">
          <CheckCircle className="h-6 w-6 shrink-0" />
          <span className="font-medium break-words">{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mx-4 mt-4 shadow-lg">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <span className="font-medium break-words">{error}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <form
          id="pump-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Basic Information</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Pump Name</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                    placeholder="Enter pump name"
                    {...register('name', { required: 'Pump name is required' })}
                  />
                  {errors.name && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.name.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Pump Type</span>
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
                <h2 className="card-title text-lg mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Hardware Configuration
                </h2>

                {/* DC Pump / Valve Pin */}
                {(pumpType === 'dc' || pumpType === 'valve') && (
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
                {pumpType === 'stepper' && (
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
                        <span className="label-text font-medium">Step Pin</span>
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
                <h2 className="card-title text-lg mb-4 flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Timing Configuration
                </h2>

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
                {pumpType === 'stepper' && (
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
                <h2 className="card-title text-lg mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Capacity Configuration
                </h2>

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
              onClick={() => navigate({ to: '/pumps' })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <div className="loading loading-spinner loading-sm"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-2">Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPumpPage;
