import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Slider,
  Button,
  Space,
  InputNumber,
  Select,
  Collapse,
} from 'antd';
import { PlusCircle } from 'lucide-react';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const DrinkCustomizer = ({
  disableBoosting = false,
  customizations,
  onCustomizationsChange,
  availableIngredients = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const handleBoostChange = (value) => {
    onCustomizationsChange({
      ...customizations,
      boost: value,
    });
  };

  const handleAdditionalIngredientAmountChange = (ingredientId, amount) => {
    const updatedIngredients = customizations.additionalIngredients.map(
      (ing) => (ing.ingredient.id === ingredientId ? { ...ing, amount } : ing),
    );
    onCustomizationsChange({
      ...customizations,
      additionalIngredients: updatedIngredients,
    });
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient) return;

    const exists = customizations.additionalIngredients.some(
      (ing) => ing.ingredient.id === selectedIngredient.id,
    );

    if (!exists) {
      onCustomizationsChange({
        ...customizations,
        additionalIngredients: [
          ...customizations.additionalIngredients,
          {
            ingredient: selectedIngredient,
            amount: 0,
            manualAdd: true,
          },
        ],
      });
    }

    setSelectedIngredient(null);
    setAddingIngredient(false);
  };

  return (
    <Card className="mb-6">
      <Collapse
        items={[
          {
            key: '1',
            label: <Title level={5}>Customize Drink</Title>,
            children: (
              <>
                <div className="mb-6">
                  <Title level={5}>Alcohol Content Adjustment</Title>
                  <Text type="secondary" className="block mb-2">
                    Adjust the strength of your drink by modifying the alcohol
                    content
                  </Text>
                  <Slider
                    value={customizations.boost}
                    onChange={handleBoostChange}
                    min={0}
                    max={200}
                    step={10}
                    marks={{
                      0: '0%',
                      100: 'Normal',
                      200: '+100%',
                    }}
                    disabled={disableBoosting}
                    tooltip={{
                      formatter: (value) => `${value - 100}%`,
                    }}
                  />
                </div>

                <div>
                  <Title level={5}>Additional Ingredients</Title>
                  <Text type="secondary" className="block mb-4">
                    Add extra ingredients to customize your drink
                  </Text>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {customizations.additionalIngredients.map(
                      ({ ingredient, amount }) => (
                        <Card key={ingredient.id} size="small">
                          <div className="flex flex-col">
                            <Text strong>{ingredient.name}</Text>
                            <div className="mt-2">
                              <InputNumber
                                min={0}
                                max={100}
                                value={amount}
                                onChange={(value) =>
                                  handleAdditionalIngredientAmountChange(
                                    ingredient.id,
                                    value,
                                  )
                                }
                                addonAfter="ml"
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                        </Card>
                      ),
                    )}

                    {addingIngredient ? (
                      <Card size="small">
                        <div className="flex flex-col gap-2">
                          <Text strong>Add New Ingredient</Text>
                          <Select
                            placeholder="Select ingredient"
                            value={selectedIngredient?.id}
                            onChange={(value) => {
                              const ingredient = availableIngredients.find(
                                (ing) => ing.id === value,
                              );
                              setSelectedIngredient(ingredient);
                            }}
                            options={availableIngredients
                              .filter(
                                (ing) =>
                                  !customizations.additionalIngredients.some(
                                    (added) => added.ingredient.id === ing.id,
                                  ),
                              )
                              .map((ing) => ({
                                label: ing.name,
                                value: ing.id,
                              }))}
                          />
                          <Space>
                            <Button
                              type="primary"
                              onClick={handleAddIngredient}
                              disabled={!selectedIngredient}
                            >
                              Add
                            </Button>
                            <Button
                              onClick={() => {
                                setAddingIngredient(false);
                                setSelectedIngredient(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    ) : (
                      <Card
                        size="small"
                        className="flex items-center justify-center cursor-pointer hover:bg-gray-50"
                        onClick={() => setAddingIngredient(true)}
                      >
                        <div className="text-center">
                          <PlusCircle className="mx-auto mb-2" size={24} />
                          <Text>Add Ingredient</Text>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default DrinkCustomizer;
