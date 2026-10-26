import { GlassWater, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGlasses } from '@/hooks/useGlasses';
import { getGlassSizeMl } from '@/pages/Shared/order';
import type { Glass } from '@/pages/Shared/order';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loading, glasses, selectGlass } = useGlasses({
    token,
    defaultGlass,
    selectedGlass,
    setSelectedGlass,
    onGlassChange,
  });

  if (loading) {
    return (
      <div className="w-full space-y-2">
        <Label className="flex items-center gap-2">
          <GlassWater size={16} />
          Glass Size
        </Label>
        <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
          <GlassWater size={24} className="text-muted-foreground" />
          <Loader2 className="size-6 animate-spin" />
          <span className="text-muted-foreground text-base">
            Loading glass...
          </span>
        </div>
      </div>
    );
  }

  const handleGlassSelect = (glass: Glass) => {
    selectGlass(glass);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="w-full">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="w-full h-auto min-h-12 sm:min-h-14 justify-start text-left p-3 sm:p-4"
        >
          {selectedGlass ? (
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <GlassWater size={24} className="shrink-0 sm:w-5 sm:h-5" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-base truncate">
                    {selectedGlass.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getGlassSizeMl(selectedGlass)}ml capacity
                  </div>
                </div>
              </div>
              <Badge className="shrink-0">
                {getGlassSizeMl(selectedGlass)}ml
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <GlassWater size={24} />
              <span className="text-base">Select a glass</span>
            </div>
          )}
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GlassWater size={24} />
              Select Glass Size
            </DialogTitle>
          </DialogHeader>

          <RadioGroup
            value={selectedGlass?.id}
            onValueChange={(value) => {
              const glass = glasses.find((g) => g.id === value);
              if (glass) handleGlassSelect(glass);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto"
          >
            {glasses.map((glass) => (
              <label
                key={glass.id}
                className={`
                  cursor-pointer transition-all duration-200 rounded-lg border p-4
                  ${
                    selectedGlass?.id === glass.id
                      ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary'
                      : 'bg-card hover:bg-accent hover:border-primary/50'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={glass.id} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-base truncate">
                        {glass.name}
                      </h4>
                      <Badge
                        variant={
                          selectedGlass?.id === glass.id
                            ? 'secondary'
                            : 'default'
                        }
                        className="shrink-0"
                      >
                        {getGlassSizeMl(glass)}ml
                      </Badge>
                    </div>
                    {glass.description && (
                      <p className="text-base mt-1 opacity-90">
                        {glass.description}
                      </p>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </RadioGroup>

          {glasses.length === 0 && (
            <Alert>
              <GlassWater className="size-6" />
              <AlertDescription>No glasses available</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlassSelector;
