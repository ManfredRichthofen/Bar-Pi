import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Space,
  message,
  Card,
  Spin,
  Alert,
  Image,
  InputNumber,
  Form,
  Tag,
} from 'antd';
import { BeakerIcon, XCircle, PlayCircle } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import cocktailService from '../services/cocktail.service';
import DrinkCustomizer from '../components/DrinkCustomizer';
import glassService from '../services/glass.service';
import IngredientRequirements from '../components/IngredientRequirements';
import GlassSelector from '../components/GlassSelector';

const { Title, Text } = Typography;

const Order = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feasibilityResult, setFeasibilityResult] = useState(null);
  const [amountToProduce, setAmountToProduce] = useState(null);
  const [form] = Form.useForm();
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const navigate = useNavigate();
  const recipe = location.state?.recipe;
  const [customizations, setCustomizations] = useState({
    boost: 100,
    additionalIngredients: [],
  });
  const [selectedGlass, setSelectedGlass] = useState(null);

  useEffect(() => {
    if (recipe) {
      if (recipe.defaultGlass) {
        setSelectedGlass(recipe.defaultGlass);
        setAmountToProduce(recipe.defaultGlass.sizeInMl);
      } else {
        setSelectedGlass(null);
        setAmountToProduce(250);
      }
      form.setFieldValue('amount', amountToProduce);
      checkFeasibility(recipe.id, getOrderConfig());
    }
  }, [recipe]);

  const getOrderConfig = () => {
    return {
      amountOrderedInMl: amountToProduce || 250,
      customisations: {
        boost: customizations.boost,
        additionalIngredients: customizations.additionalIngredients
          .filter((ing) => ing.amount > 0)
          .map((ing) => ({
            ingredientId: ing.ingredient.id,
            amount: ing.amount,
          })),
      },
      productionStepReplacements: [],
    };
  };

  const checkFeasibility = async (recipeId, orderConfig) => {
    setChecking(true);
    try {
      const result = await cocktailService.checkFeasibility(
        recipeId,
        orderConfig,
        false,
        token,
      );
      setFeasibilityResult(result);
      return result;
    } catch (error) {
      message.error('Failed to check drink feasibility');
      return false;
    } finally {
      setChecking(false);
    }
  };

  // Helper function to check if all ingredients are available
  const areAllIngredientsAvailable = (requiredIngredients) => {
    if (!requiredIngredients) return false;
    return !requiredIngredients.some((item) => item.amountMissing > 0);
  };

  const orderDrink = async (recipeId, orderConfig) => {
    setLoading(true);
    try {
      // First check if the drink is feasible
      const isFeasible = await checkFeasibility(recipeId, orderConfig);
      if (!isFeasible?.feasible) {
        message.error('This drink cannot be made at the moment');
        return;
      }

      // Check if all ingredients are available
      if (!areAllIngredientsAvailable(isFeasible.requiredIngredients)) {
        message.error('Some ingredients are missing or insufficient');
        return;
      }

      await cocktailService.order(recipeId, orderConfig, false, token);
      message.success('Drink ordered successfully');
      navigate('/drinks');
    } catch (error) {
      message.error('Failed to order drink');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDrink = () => {
    const orderConfig = getOrderConfig();
    orderDrink(recipe.id, orderConfig);
  };

  const cancelOrder = async () => {
    try {
      await cocktailService.cancelCocktail(token);
      message.success('Order cancelled');
    } catch (error) {
      message.error('Failed to cancel order');
    }
  };

  const continueProduction = async () => {
    try {
      await cocktailService.continueProduction(token);
      message.success('Production continued');
    } catch (error) {
      message.error('Failed to continue production');
    }
  };

  const handleGlassChange = (glass) => {
    setSelectedGlass(glass);
    if (glass) {
      setAmountToProduce(glass.sizeInMl);
    }
  };

  const handleCustomAmountChange = (value) => {
    setAmountToProduce(value);
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!recipe) {
    return <Navigate to="/drinks" />;
  }

  const canOrderDrink =
    feasibilityResult?.feasible &&
    !loading &&
    !checking &&
    areAllIngredientsAvailable(feasibilityResult?.requiredIngredients);

  // Add this helper function to organize ingredients by status
  const organizeIngredients = (requiredIngredients) => {
    return {
      inBar: requiredIngredients.filter((item) => item.ingredient.inBar),
      notInBar: requiredIngredients.filter((item) => !item.ingredient.inBar),
      automated: requiredIngredients.filter(
        (item) => item.ingredient.type === 'automated',
      ),
      manual: requiredIngredients.filter(
        (item) => item.ingredient.type === 'manual',
      ),
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 pt-20 sm:pt-24 min-h-screen">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <Title level={2} className="text-xl sm:text-2xl">
          Drink Production
        </Title>
      </div>

      <Form form={form}>
        <Card className="mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {recipe.image && (
              <div className="w-full lg:w-1/3">
                <Image
                  className="w-full rounded-lg object-cover max-h-[300px] lg:max-h-none"
                  src={recipe.image}
                  alt={recipe.name}
                />
              </div>
            )}

            <div className="flex-1">
              <Title level={3} className="text-lg sm:text-xl mb-2">
                {recipe.name}
              </Title>
              {recipe.description && (
                <Text className="block mb-4 text-sm sm:text-base">
                  {recipe.description}
                </Text>
              )}

              <GlassSelector
                selectedGlass={selectedGlass}
                customAmount={amountToProduce}
                onGlassChange={handleGlassChange}
                onCustomAmountChange={handleCustomAmountChange}
                defaultGlass={recipe.defaultGlass}
                token={token}
              />

              <Space className="w-full mt-4" size="small">
                <Button
                  type="primary"
                  icon={<BeakerIcon size={16} />}
                  onClick={handleMakeDrink}
                  loading={loading}
                  disabled={!canOrderDrink}
                  className="flex items-center gap-1 text-sm sm:text-base"
                >
                  {feasibilityResult
                    ? `Make Drink (${feasibilityResult.totalAmountInMl}ml)`
                    : 'Make Drink'}
                </Button>
                <Button
                  onClick={() => navigate('/drinks')}
                  className="text-sm sm:text-base"
                >
                  Back to Drinks
                </Button>
              </Space>
            </div>
          </div>
        </Card>

        <DrinkCustomizer
          disableBoosting={!recipe?.boostable}
          customizations={customizations}
          onCustomizationsChange={setCustomizations}
          availableIngredients={
            feasibilityResult?.requiredIngredients
              ?.map((item) => item.ingredient)
              ?.filter((ing) => ing.type === 'automated') || []
          }
        />
      </Form>

      {checking ? (
        <Card className="mb-4 sm:mb-6">
          <div className="flex justify-center py-4">
            <Spin size="large" />
          </div>
        </Card>
      ) : (
        feasibilityResult && (
          <>
            <Card className="mb-4 sm:mb-6">
              <Title level={4} className="text-lg sm:text-xl">
                Feasibility Check Result
              </Title>
              <Alert
                message={
                  feasibilityResult.feasible
                    ? 'Drink can be made'
                    : 'Drink cannot be made'
                }
                description={
                  feasibilityResult.feasible
                    ? `Total amount: ${feasibilityResult.totalAmountInMl}ml`
                    : feasibilityResult.reason
                }
                type={feasibilityResult.feasible ? 'success' : 'error'}
                showIcon
                className="mb-4"
              />
            </Card>

            {feasibilityResult.requiredIngredients?.length > 0 && (
              <IngredientRequirements
                requiredIngredients={feasibilityResult.requiredIngredients}
              />
            )}

            {feasibilityResult.requiredIngredients?.length > 0 &&
              (() => {
                const ingredients = organizeIngredients(
                  feasibilityResult.requiredIngredients,
                );
                return (
                  <div className="space-y-4">
                    {/* Automated Ingredients */}
                    {ingredients.automated.length > 0 && (
                      <Card className="mb-4">
                        <Title level={5} className="text-base sm:text-lg">
                          Automated Ingredients
                        </Title>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {ingredients.automated.map((item, index) => (
                            <Card
                              size="small"
                              key={index}
                              className="bg-gray-50"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <Text strong className="text-sm sm:text-base">
                                    {item.ingredient.name}
                                  </Text>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    Required: {item.amountRequired}
                                    {item.ingredient.unit}
                                    {item.amountMissing > 0 && (
                                      <div className="text-red-500">
                                        Missing: {item.amountMissing}
                                        {item.ingredient.unit}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Manual Ingredients */}
                    {ingredients.manual.length > 0 && (
                      <Card className="mb-4">
                        <Title level={5} className="text-base sm:text-lg">
                          Manual Ingredients
                        </Title>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {ingredients.manual.map((item, index) => (
                            <Card
                              size="small"
                              key={index}
                              className="bg-gray-50"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <Text strong className="text-sm sm:text-base">
                                    {item.ingredient.name}
                                  </Text>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    {item.amount}
                                    {item.ingredient.unit}
                                  </div>
                                </div>
                                <Tag
                                  color={
                                    item.ingredient.inBar ? 'success' : 'error'
                                  }
                                  className="text-xs sm:text-sm"
                                >
                                  {item.ingredient.inBar
                                    ? 'In Bar'
                                    : 'Not In Bar'}
                                </Tag>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Missing Ingredients Warning */}
                    {ingredients.notInBar.length > 0 && (
                      <Alert
                        message="Missing Ingredients"
                        description={
                          <div>
                            <Text className="text-sm sm:text-base">
                              The following ingredients are not available in the
                              bar:
                            </Text>
                            <ul className="mt-2 text-sm">
                              {ingredients.notInBar.map((item, index) => (
                                <li key={index}>
                                  {item.ingredient.name} ({item.amount}
                                  {item.ingredient.unit})
                                </li>
                              ))}
                            </ul>
                          </div>
                        }
                        type="warning"
                        showIcon
                      />
                    )}
                  </div>
                );
              })()}
          </>
        )
      )}

      <Card>
        <Space direction="vertical" className="w-full">
          <Title level={4} className="text-lg sm:text-xl">
            Production Controls
          </Title>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlayCircle size={16} />}
              onClick={continueProduction}
              className="flex items-center gap-1 text-sm sm:text-base"
            >
              Continue Production
            </Button>
            <Button
              danger
              icon={<XCircle size={16} />}
              onClick={cancelOrder}
              className="flex items-center gap-1 text-sm sm:text-base"
            >
              Cancel Production
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default Order;
