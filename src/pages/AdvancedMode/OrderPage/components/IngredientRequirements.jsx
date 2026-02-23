import { CheckCircle, XCircle, AlertTriangle, Beaker } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const IngredientRequirements = ({ requiredIngredients }) => {
  const { t } = useTranslation();
  const insufficientIngredients = requiredIngredients.filter(
    (x) => x.amountMissing > 0,
  );
  const isFulfilled = insufficientIngredients.length === 0;

  // Calculate fulfillment percentage
  const fulfilledCount =
    requiredIngredients.length - insufficientIngredients.length;
  const fulfillmentPercentage =
    requiredIngredients.length > 0
      ? (fulfilledCount / requiredIngredients.length) * 100
      : 0;

  // Organize ingredients by type
  const automatedIngredients = requiredIngredients.filter(
    (x) => x.ingredient.type === 'automated',
  );
  const manualIngredients = requiredIngredients.filter(
    (x) => x.ingredient.type === 'manual',
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Overall Status Card */}
      <Card
        className={
          isFulfilled
            ? 'border-green-200 bg-green-50/50'
            : 'border-orange-200 bg-orange-50/50'
        }
      >
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isFulfilled ? (
                <CheckCircle className="text-green-600 shrink-0" size={18} />
              ) : (
                <AlertTriangle className="text-orange-600 shrink-0" size={18} />
              )}
              <CardTitle className="text-base sm:text-lg truncate">
                {isFulfilled
                  ? 'All ingredients available'
                  : 'Missing ingredients'}
              </CardTitle>
            </div>
            <Badge
              variant={isFulfilled ? 'default' : 'destructive'}
              className="shrink-0 text-xs"
            >
              {fulfilledCount}/{requiredIngredients.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Ingredient fulfillment</span>
              <span className="font-medium">
                {Math.round(fulfillmentPercentage)}%
              </span>
            </div>
            <Progress value={fulfillmentPercentage} className="h-1.5 sm:h-2" />

            {!isFulfilled && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  {insufficientIngredients.length} ingredient(s) need to be
                  restocked:
                  <div className="mt-1.5 sm:mt-2">
                    {insufficientIngredients.slice(0, 3).map((item, index) => (
                      <span key={index}>
                        {item.ingredient.name}
                        {index <
                          Math.min(2, insufficientIngredients.length - 1) &&
                          ', '}
                        {index === 2 &&
                          insufficientIngredients.length > 3 &&
                          ` +${insufficientIngredients.length - 3} more`}
                      </span>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Automated Ingredients */}
      {automatedIngredients.length > 0 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Beaker className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">Automated Ingredients</span>
              <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                {
                  automatedIngredients.filter((x) => x.amountMissing === 0)
                    .length
                }
                /{automatedIngredients.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {automatedIngredients.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.amountMissing === 0
                        ? 'bg-green-500'
                        : 'bg-orange-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {item.ingredient.name}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Required: {item.amountRequired} {item.ingredient.unit}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    variant={
                      item.amountMissing === 0 ? 'default' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {item.amountMissing === 0
                      ? 'Available'
                      : `Missing ${item.amountMissing} ${item.ingredient.unit}`}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Manual Ingredients */}
      {manualIngredients.length > 0 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">Manual Ingredients</span>
              <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                {manualIngredients.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {manualIngredients.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.ingredient.inBar ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {item.ingredient.name}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Amount: {item.amount} {item.ingredient.unit}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={item.ingredient.inBar ? 'default' : 'secondary'}
                  className="shrink-0 text-xs"
                >
                  {item.ingredient.inBar ? 'In Bar' : 'Manual Add'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IngredientRequirements;
