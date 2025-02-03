import React from 'react';
import { Card, Typography, List } from 'antd';
import { CheckCircle, XCircle } from 'lucide-react';

const { Title, Text } = Typography;

const IngredientRequirements = ({ requiredIngredients }) => {
  const insufficientIngredients = requiredIngredients.filter(
    (x) => x.amountMissing > 0,
  );
  const isFulfilled = insufficientIngredients.length === 0;

  return (
    <Card
      className={`mb-4 ${isFulfilled ? 'bg-blue-50' : 'bg-yellow-50'}`}
      title={
        <div className="flex items-center gap-2">
          {isFulfilled ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <XCircle className="text-red-500" size={20} />
          )}
          <Title level={5} style={{ margin: 0 }}>
            {isFulfilled ? 'All ingredients available' : 'Missing ingredients'}
          </Title>
        </div>
      }
    >
      <List
        size="small"
        dataSource={isFulfilled ? requiredIngredients : insufficientIngredients}
        renderItem={(item) => (
          <List.Item>
            <div className="flex justify-between w-full">
              <Text>{item.ingredient.name}</Text>
              <Text strong>
                {item.amountRequired} {item.ingredient.unit}
                {!isFulfilled && item.amountMissing > 0 && (
                  <span className="text-red-500">
                    {' '}
                    (missing: {item.amountMissing} {item.ingredient.unit})
                  </span>
                )}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default IngredientRequirements;
