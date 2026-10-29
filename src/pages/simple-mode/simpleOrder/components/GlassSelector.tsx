import { ChevronRight, GlassWater, Loader2 } from 'lucide-react';
import { m } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGlasses } from '@/hooks/useGlasses';
import { usePress } from '@/hooks/usePress';
import type { Glass } from '@/pages/Shared/order';
import { getGlassSizeMl } from '@/pages/Shared/order';

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
  const { t } = useTranslation();
  const press = usePress({ lift: false });
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
      <div className="flex items-center gap-3 p-4 bg-surface rounded-lg border">
        <Loader2 className="size-6 animate-spin text-foreground-muted" />
        <span className="text-foreground-muted text-base">
          {t('simple_order.glass_loading', 'Loading glasses...')}
        </span>
      </div>
    );
  }

  if (glasses.length === 0) {
    return (
      <Alert className="bg-warning-tint border-warning">
        <GlassWater className="size-6 text-warning-tint-ink" />
        <AlertDescription className="text-base text-warning-tint-ink">
          {t(
            'simple_order.glass_none_hint',
            'No glasses are set up yet. Ask your host to add one.',
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const handleGlassSelect = (glass: Glass) => {
    selectGlass(glass);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="w-full h-auto min-h-control-lg justify-start text-left p-3 sm:p-4"
      >
        {selectedGlass ? (
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <GlassWater className="size-6 shrink-0" />
              <span className="font-semibold text-base truncate">
                {selectedGlass.name}
              </span>
            </div>
            <Badge className="shrink-0">
              {getGlassSizeMl(selectedGlass)}ml
            </Badge>
            <ChevronRight className="size-6 shrink-0 text-foreground-muted" />
          </div>
        ) : (
          <div className="flex items-center gap-3 text-foreground-muted w-full">
            <GlassWater className="size-6" />
            <span className="text-base flex-1">
              {t('simple_order.glass_select', 'Select a glass')}
            </span>
            <ChevronRight className="size-6 shrink-0" />
          </div>
        )}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GlassWater className="size-6" />
              {t('simple_order.glass_dialog_title', 'Select Glass Size')}
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
              <m.label
                key={glass.id}
                {...press}
                className={`
                  cursor-pointer transition-colors duration-150 ease-out rounded-lg border p-4
                  ${
                    selectedGlass?.id === glass.id
                      ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary'
                      : 'bg-surface [@media(hover:hover)]:hover:bg-primary-tint [@media(hover:hover)]:hover:border-border-strong'
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
              </m.label>
            ))}
          </RadioGroup>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              {t('common.close', 'Close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlassSelector;
