import React, { useState, useEffect } from 'react';
import { GlassWater } from 'lucide-react';
import glassService from '../../../services/glass.service';

const SimpleGlassSelector = ({
  selectedGlass,
  defaultGlass = null,
  token,
  setSelectedGlass,
}) => {
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
        <label className="label">
          <span className="label-text flex items-center gap-2">
            <GlassWater size={16} />
            Glass Size
          </span>
        </label>
        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
          <GlassWater size={20} className="text-base-content/40" />
          <span className="loading loading-spinner loading-sm"></span>
          <span className="text-base-content/60">Loading glass...</span>
        </div>
      </div>
    );
  }

  if (!selectedGlass) {
    return (
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text flex items-center gap-2">
            <GlassWater size={16} />
            Glass Size
          </span>
        </label>
        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
          <GlassWater size={20} className="text-base-content/40" />
          <span className="text-base-content/60">No glass selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text flex items-center gap-2 font-medium">
          <GlassWater size={16} />
          Glass Size
        </span>
      </label>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <GlassWater size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{selectedGlass.name}</h3>
                <p className="text-sm text-base-content/70">
                  {selectedGlass.sizeInMl}ml capacity
                </p>
              </div>
            </div>
            <div className="badge badge-primary badge-lg">
              {selectedGlass.sizeInMl}ml
            </div>
          </div>

          {selectedGlass.description && (
            <div className="mt-3 pt-3 border-t border-base-200">
              <p className="text-sm text-base-content/70 leading-relaxed">
                {selectedGlass.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleGlassSelector;
