import { GlassWater, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import glassService from '../../../../services/glass.service';

const GlassSelector = ({
  selectedGlass,
  defaultGlass = null,
  token,
  setSelectedGlass,
  onGlassChange,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [glasses, setGlasses] = useState([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const fetchGlasses = async () => {
      try {
        const allGlasses = await glassService.getGlasses(token);
        setGlasses(allGlasses);

        if (!hasInitialized.current) {
          hasInitialized.current = true;

          console.log('GlassSelector initializing:', {
            defaultGlass,
            selectedGlass,
            glassCount: allGlasses.length,
          });

          if (defaultGlass) {
            const glass = allGlasses.find(
              (g) => g.id === defaultGlass.id,
            );
            if (glass) {
              console.log('Setting default glass:', glass);
              setSelectedGlass(glass);
              if (onGlassChange) {
                onGlassChange(glass);
              }
            }
          } else if (allGlasses.length > 0 && !selectedGlass) {
            // Auto-select first glass if none selected
            console.log('Auto-selecting first glass:', allGlasses[0]);
            setSelectedGlass(allGlasses[0]);
            if (onGlassChange) {
              onGlassChange(allGlasses[0]);
            }
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
      <div className="w-full space-y-2">
        <Label className="flex items-center gap-2 text-sm sm:text-base">
          <GlassWater size={16} />
          Glass Size
        </Label>
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-card rounded-lg border">
          <GlassWater size={18} className="text-muted-foreground" />
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">
            Loading glasses...
          </span>
        </div>
      </div>
    );
  }

  const handleGlassSelect = (glassId) => {
    const glass = glasses.find((g) => g.id === glassId);
    if (glass) {
      setSelectedGlass(glass);
      if (onGlassChange) {
        onGlassChange(glass);
      }
    }
  };

  return (
    <div className="w-full space-y-2">
      <Label className="flex items-center gap-2 text-sm sm:text-base">
        <GlassWater size={16} />
        Glass Size
      </Label>
      
      <Select
        value={selectedGlass?.id || ''}
        onValueChange={handleGlassSelect}
      >
        <SelectTrigger className="w-full h-11 sm:h-12">
          <SelectValue placeholder="Select a glass">
            {selectedGlass ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <GlassWater size={16} className="shrink-0" />
                  <span className="font-medium text-sm sm:text-base truncate">{selectedGlass.name}</span>
                </div>
                <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                  {selectedGlass.sizeInMl}ml
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <GlassWater size={16} />
                <span className="text-sm sm:text-base">Select a glass</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {glasses.map((glass) => (
            <SelectItem key={glass.id} value={glass.id} className="py-3">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GlassWater size={16} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">{glass.name}</div>
                    {glass.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {glass.description}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                  {glass.sizeInMl}ml
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedGlass && selectedGlass.description && (
        <div className="text-xs sm:text-sm text-muted-foreground mt-1.5">
          {selectedGlass.description}
        </div>
      )}

      {glasses.length === 0 && !loading && (
        <Alert variant="destructive">
          <GlassWater className="w-4 h-4" />
          <AlertDescription className="text-sm">No glasses available</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GlassSelector;
