import { Clock, Info } from 'lucide-react';

interface Glass {
  name: string;
  sizeInMl: number;
}

interface DrinkInfoProps {
  description?: string;
  alcoholic: boolean;
  defaultGlass?: Glass;
}

const DrinkInfo = ({
  description,
  alcoholic,
  defaultGlass,
}: DrinkInfoProps) => {
  return (
    <>
      {/* Description */}
      {description && (
        <div className="card bg-base-200/50 shadow-sm">
          <div className="card-body p-3 sm:p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-base-content/90 flex items-center gap-2">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              Description
            </h2>
            <p className="text-base-content/70 text-xs sm:text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="card bg-base-200/50 shadow-sm">
        <div className="card-body p-3 sm:p-4">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-base-content/90 flex items-center gap-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            Preparation
          </h2>
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-base-content/70">
            <div className="flex items-center justify-between">
              <span>Type:</span>
              <span className="font-medium">
                {alcoholic ? 'Alcoholic' : 'Non-alcoholic'}
              </span>
            </div>
            {defaultGlass && (
              <div className="flex items-center justify-between">
                <span>Glass:</span>
                <span className="font-medium">
                  {defaultGlass.name} ({defaultGlass.sizeInMl}ml)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DrinkInfo;
