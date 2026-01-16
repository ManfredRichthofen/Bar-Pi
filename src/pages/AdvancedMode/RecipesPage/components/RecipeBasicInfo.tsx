import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Glass {
  id: number;
  name: string;
  size: number;
}

interface RecipeBasicInfoProps {
  name: string;
  description: string;
  defaultGlass: Glass | null;
  defaultAmountToFill: number;
  glasses: Glass[];
  onUpdate: (field: string, value: any) => void;
}

export const RecipeBasicInfo: React.FC<RecipeBasicInfoProps> = ({
  name,
  description,
  defaultGlass,
  defaultAmountToFill,
  glasses,
  onUpdate,
}) => {
  const updateField = (field: string, value: any) => {
    onUpdate(field, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Recipe Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter recipe name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Enter recipe description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="glass">Default Glass</Label>
            <Select
              value={defaultGlass?.id?.toString() || ''}
              onValueChange={(value) => {
                const glass = glasses.find(
                  (g) => g.id.toString() === value,
                );
                updateField('defaultGlass', glass || null);
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {defaultGlass ? `${defaultGlass.name} (${defaultGlass.size}ml)` : "Select a glass"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {glasses.map((glass) => (
                  <SelectItem key={glass.id} value={glass.id.toString()}>
                    {glass.name} ({glass.size}ml)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fillAmount">Fill Amount (ml)</Label>
            <Input
              id="fillAmount"
              type="number"
              value={defaultAmountToFill}
              onChange={(e) =>
                updateField('defaultAmountToFill', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
