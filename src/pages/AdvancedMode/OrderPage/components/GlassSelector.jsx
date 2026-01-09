import React, { useState, useEffect } from 'react';
import { GlassWater, Loader2 } from 'lucide-react';
import glassService from '../../../../services/glass.service';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const GlassSelector = ({
  selectedGlass,
  customAmount,
  onGlassChange,
  onCustomAmountChange,
  defaultGlass = null,
  token,
}) => {
  const [glasses, setGlasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlasses = async () => {
      try {
        const response = await glassService.getGlasses(token);
        setGlasses(response);

        if (!selectedGlass && defaultGlass) {
          const defaultGlassFromList = response.find(
            (g) => g.id === defaultGlass.id,
          );
          if (defaultGlassFromList) {
            onGlassChange(defaultGlassFromList);
            onCustomAmountChange(defaultGlassFromList.sizeInMl);
          }
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
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <GlassWater size={16} />
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <Label className="flex items-center gap-2">
        <GlassWater size={16} />
        Glass Size
      </Label>

      <div className="flex gap-2">
        <Select
          value={selectedGlass?.id || 'custom'}
          onValueChange={(value) => {
            if (value === 'custom') {
              onGlassChange(null);
            } else {
              const glass = glasses.find((g) => g.id === value);
              onGlassChange(glass);
              onCustomAmountChange(glass.sizeInMl);
            }
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Amount</SelectItem>
            {glasses.map((glass) => (
              <SelectItem key={glass.id} value={glass.id}>
                {glass.name} {defaultGlass?.id === glass.id ? '(Default)' : ''}{' '}
                - {glass.sizeInMl}ml
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!selectedGlass && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={10}
              max={5000}
              value={customAmount}
              onChange={(e) => onCustomAmountChange(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">ml</span>
          </div>
        )}
      </div>

      {selectedGlass && selectedGlass.description && (
        <p className="text-sm text-muted-foreground">
          {selectedGlass.description}
        </p>
      )}
    </div>
  );
};

export default GlassSelector;
