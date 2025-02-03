import React, { useState, useEffect } from 'react';
import { Select, Form, InputNumber, Space, Typography, Spin } from 'antd';
import { GlassWater } from 'lucide-react';
import glassService from '../services/glass.service';

const { Text } = Typography;

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

  // Initial fetch of glasses and default selection
  useEffect(() => {
    const fetchGlasses = async () => {
      try {
        const response = await glassService.getGlasses(token);
        setGlasses(response);

        // If no glass is selected and we have a default glass, select it
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
  }, [token]); // Only run on token change to avoid infinite loops

  const formatGlassOption = (glass) => {
    const isDefault = defaultGlass?.id === glass.id;
    return {
      label: (
        <div className="flex justify-between items-center">
          <span>{glass.name}</span>
          <span className="text-gray-500">
            {isDefault ? '(Default) ' : ''}
            {glass.sizeInMl}ml
          </span>
        </div>
      ),
      value: glass.id,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <GlassWater size={16} />
        <Spin size="small" />
      </div>
    );
  }

  const glassOptions = glasses.map(formatGlassOption);

  return (
    <Space direction="vertical" className="w-full">
      <Form.Item
        label={
          <div className="flex items-center gap-2">
            <GlassWater size={16} />
            <span>Glass Size</span>
          </div>
        }
      >
        <Space>
          <Select
            value={selectedGlass?.id || 'custom'}
            onChange={(value) => {
              if (value === 'custom') {
                onGlassChange(null);
              } else {
                const glass = glasses.find((g) => g.id === value);
                onGlassChange(glass);
                onCustomAmountChange(glass.sizeInMl);
              }
            }}
            style={{ width: 250 }}
            placeholder="Select a glass"
            options={[
              ...glassOptions,
              {
                label: 'Custom Amount',
                value: 'custom',
              },
            ]}
          />

          {!selectedGlass && (
            <InputNumber
              min={10}
              max={5000}
              value={customAmount}
              onChange={onCustomAmountChange}
              addonAfter="ml"
              style={{ width: 120 }}
            />
          )}
        </Space>
      </Form.Item>

      {selectedGlass && (
        <Text type="secondary" className="block">
          {selectedGlass.description}
        </Text>
      )}
    </Space>
  );
};

export default GlassSelector;
