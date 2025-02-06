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
      <div className="flex items-center gap-2">
        <GlassWater size={16} />
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    );
  }

  if (!selectedGlass) {
    return null;
  }

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text flex items-center gap-2">
          <GlassWater size={16} />
          Glass Size
        </span>
      </label>

      <div className="flex gap-2">
        <div className="select select-bordered flex items-center px-4">
          {selectedGlass.name} - {selectedGlass.sizeInMl}ml
        </div>
      </div>

      {selectedGlass.description && (
        <label className="label">
          <span className="label-text-alt text-base-content/70">
            {selectedGlass.description}
          </span>
        </label>
      )}
    </div>
  );
};

export default SimpleGlassSelector;
