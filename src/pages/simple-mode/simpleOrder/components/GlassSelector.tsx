import { useState, useEffect } from 'react';
import { GlassWater } from 'lucide-react';
import glassService from '../../../../services/glass.service';

interface Glass {
  id: string;
  name: string;
  sizeInMl: number;
  description?: string;
}

interface GlassSelectorProps {
  selectedGlass: Glass | null;
  defaultGlass?: Glass | null;
  token: string;
  setSelectedGlass: (glass: Glass | null) => void;
  onGlassChange?: (glass: Glass | null) => void;
}

const GlassSelector = ({
  selectedGlass,
  defaultGlass = null,
  token,
  setSelectedGlass,
  onGlassChange,
}: GlassSelectorProps) => {
  const [loading, setLoading] = useState(true);
  const [glasses, setGlasses] = useState<Glass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchGlasses = async () => {
      try {
        // Fetch all available glasses
        const allGlasses = await glassService.getGlasses(token);
        setGlasses(allGlasses);

        // If default glass is provided, select it
        if (defaultGlass) {
          const glass = allGlasses.find((g: Glass) => g.id === defaultGlass.id);
          if (glass) {
            setSelectedGlass(glass);
          }
        } else if (allGlasses.length > 0 && !selectedGlass) {
          // Auto-select first glass if none selected
          setSelectedGlass(allGlasses[0]);
        }
      } catch (error) {
        console.error('Failed to fetch glasses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchGlasses();
    }
  }, [token, defaultGlass, setSelectedGlass]);

  if (loading) {
    return (
      <div className="form-control w-full">
        <div className="label">
          <span className="label-text flex items-center gap-2 font-medium">
            <GlassWater size={16} />
            Glass Size
          </span>
        </div>
        <div className="flex items-center gap-3 p-4 bg-base-100 rounded-lg border border-base-300">
          <GlassWater size={20} className="text-base-content/40" />
          <span className="loading loading-spinner loading-sm"></span>
          <span className="text-base-content/60 text-sm sm:text-base">
            Loading glass...
          </span>
        </div>
      </div>
    );
  }

  const handleGlassSelect = (glass: Glass) => {
    setSelectedGlass(glass);
    if (onGlassChange) {
      onGlassChange(glass);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="form-control w-full">
        {/* Selected Glass Display - Click to open modal */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-outline w-full h-auto min-h-12 sm:min-h-14 justify-start text-left p-3 sm:p-4 hover:bg-base-200"
        >
          {selectedGlass ? (
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <GlassWater size={18} className="shrink-0 sm:w-5 sm:h-5" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base truncate">
                    {selectedGlass.name}
                  </div>
                  <div className="text-xs sm:text-sm text-base-content/70">
                    {selectedGlass.sizeInMl}ml capacity
                  </div>
                </div>
              </div>
              <div className="badge badge-primary badge-sm sm:badge-md shrink-0">
                {selectedGlass.sizeInMl}ml
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-base-content/60">
              <GlassWater size={18} />
              <span className="text-sm sm:text-base">Select a glass</span>
            </div>
          )}
        </button>
      </div>

      {/* Modal for glass selection */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <GlassWater size={20} />
            Select Glass Size
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {glasses.map((glass) => (
              <button
                key={glass.id}
                type="button"
                onClick={() => handleGlassSelect(glass)}
                className={`
                  card cursor-pointer transition-all duration-200 text-left
                  ${
                    selectedGlass?.id === glass.id
                      ? 'bg-primary text-primary-content shadow-lg ring-2 ring-primary'
                      : 'bg-base-100 hover:bg-base-200 border border-base-300 hover:border-primary/50'
                  }
                `}
              >
                <div className="card-body p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="glass-modal-selector"
                      className="radio radio-sm mt-1"
                      checked={selectedGlass?.id === glass.id}
                      readOnly
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-base truncate">
                          {glass.name}
                        </h4>
                        <div
                          className={`
                          badge badge-sm shrink-0
                          ${selectedGlass?.id === glass.id ? 'badge-primary-content' : 'badge-primary'}
                        `}
                        >
                          {glass.sizeInMl}ml
                        </div>
                      </div>
                      {glass.description && (
                        <p
                          className={`
                          text-sm mt-1
                          ${selectedGlass?.id === glass.id ? 'opacity-90' : 'text-base-content/70'}
                        `}
                        >
                          {glass.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {glasses.length === 0 && (
            <div className="alert alert-warning">
              <GlassWater className="w-5 h-5" />
              <span>No glasses available</span>
            </div>
          )}

          <div className="modal-action">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-ghost"
            >
              Close
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={() => setIsModalOpen(false)}>
            close
          </button>
        </form>
      </dialog>
    </>
  );
};

export default GlassSelector;
