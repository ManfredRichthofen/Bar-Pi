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
}

const GlassSelector = ({
  selectedGlass,
  defaultGlass = null,
  token,
  setSelectedGlass,
}: GlassSelectorProps) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlass = async () => {
      try {
        if (defaultGlass) {
          const glass = await glassService.getGlass(defaultGlass.id, token);
          setSelectedGlass(glass);
        }
      } catch (error) {
        console.error('Failed to fetch glass:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchGlass();
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

  if (!selectedGlass) {
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
          <span className="text-base-content/60 text-sm sm:text-base">
            No glass selected
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-control w-full">
      <div className="label">
        <span className="label-text flex items-center gap-2 font-medium">
          <GlassWater size={16} />
          Glass Size
        </span>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
        <div className="card-body p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <GlassWater size={18} className="text-primary sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {selectedGlass.name}
                </h3>
                <p className="text-xs sm:text-sm text-base-content/70">
                  {selectedGlass.sizeInMl}ml capacity
                </p>
              </div>
            </div>
            <div className="badge badge-primary badge-sm sm:badge-lg shrink-0">
              {selectedGlass.sizeInMl}ml
            </div>
          </div>

          {selectedGlass.description && (
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-base-200">
              <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                {selectedGlass.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlassSelector;
