import { Image as ImageIcon, X } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ingredientService, {
  ingredientDtoMapper,
} from '@/services/ingredient.service';

export interface IngredientRecord {
  id: number;
  name: string;
  type?: string;
  parentGroupId?: number | null;
  alcoholContent?: number;
  bottleSize?: number;
  pumpTimeMultiplier?: number;
  unit?: string;
  hasImage?: boolean;
  [key: string]: unknown;
}

interface IngredientFormValues {
  name?: string;
  type: string;
  alcoholContent: number;
  bottleSize: number;
  pumpTimeMultiplier: number;
  unit: string;
  parentGroupId?: number | null;
  image: File | null;
  imagePreview: string | null;
  removeImage: boolean;
}

const DEFAULT_VALUES: IngredientFormValues = {
  type: 'manual',
  alcoholContent: 0,
  bottleSize: 0,
  pumpTimeMultiplier: 1,
  unit: 'ml',
  image: null,
  imagePreview: null,
  removeImage: false,
};

interface IngredientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIngredient: IngredientRecord | null;
  ingredients: IngredientRecord[];
  token: string;
}

export const IngredientFormDialog: React.FC<IngredientFormDialogProps> = ({
  open,
  onOpenChange,
  editingIngredient,
  ingredients,
  token,
}) => {
  const { register, handleSubmit, setValue, watch, reset } =
    useForm<IngredientFormValues>({
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;

    if (editingIngredient) {
      reset({ ...DEFAULT_VALUES });
      Object.entries(editingIngredient).forEach(([key, value]) => {
        setValue(key as keyof IngredientFormValues, value as never);
      });
      setValue('type', editingIngredient.type || 'manual');
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, editingIngredient, reset, setValue]);

  const handleAddEdit = async (values: IngredientFormValues) => {
    try {
      if (!values.name?.trim()) {
        toast.error('Name is required');
        return;
      }

      const processedValues = {
        ...values,
        name: values.name.trim(),
        alcoholContent: values.alcoholContent
          ? parseFloat(String(values.alcoholContent))
          : 0,
        bottleSize: values.bottleSize ? parseInt(String(values.bottleSize)) : 0,
        pumpTimeMultiplier: values.pumpTimeMultiplier
          ? parseFloat(String(values.pumpTimeMultiplier))
          : 1,
        parentGroupId: values.parentGroupId || null,
        type: values.type || 'manual',
        unit: values.unit || 'ml',
      };

      if (
        processedValues.alcoholContent < 0 ||
        processedValues.alcoholContent > 100
      ) {
        toast.error('Alcohol content must be between 0 and 100');
        return;
      }

      if (processedValues.bottleSize < 0) {
        toast.error('Bottle size must be positive');
        return;
      }

      if (processedValues.pumpTimeMultiplier <= 0) {
        toast.error('Pump time multiplier must be greater than 0');
        return;
      }

      console.log('Processed values:', processedValues);

      if (editingIngredient) {
        const updateDto =
          ingredientDtoMapper.toIngredientCreateDto(processedValues);
        await ingredientService.updateIngredient(
          editingIngredient.id,
          updateDto,
          values.image,
          token,
          values.removeImage,
        );
        toast.success('Ingredient updated successfully');
      } else {
        const createDto =
          ingredientDtoMapper.toIngredientCreateDto(processedValues);
        console.log('Create DTO:', createDto);
        try {
          const response = await ingredientService.createIngredient(
            createDto,
            values.image,
            token,
          );
          console.log('Create response:', response);
          toast.success('Ingredient added successfully');
        } catch (error: unknown) {
          const axiosError = error as {
            response?: { data?: { message?: string }; status?: number };
          };
          if (axiosError.response?.data?.message) {
            toast.error(`Server error: ${axiosError.response.data.message}`);
          } else if (axiosError.response?.status === 400) {
            toast.error('Invalid input data. Please check all fields.');
          } else {
            toast.error('Failed to create ingredient');
          }
          console.error('Create error details:', {
            data: axiosError.response?.data,
            status: axiosError.response?.status,
            request: createDto,
          });
          return;
        }
      }

      onOpenChange(false);
      reset(DEFAULT_VALUES);
      window.location.reload();
    } catch (error: unknown) {
      console.error('Error saving ingredient:', error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      if (axiosError.response?.data?.message) {
        toast.error(`Error: ${axiosError.response.data.message}`);
      } else {
        toast.error(
          'Failed to save ingredient. Please check your input and try again.',
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle className="text-xl">
            {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleAddEdit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Vodka, Lime Juice"
                    {...register('name', { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentGroup" className="text-sm font-medium">
                    Parent Group
                  </Label>
                  <Select
                    value={watch('parentGroupId')?.toString() || ''}
                    onValueChange={(value) =>
                      setValue('parentGroupId', value ? parseInt(value) : null)
                    }
                  >
                    <SelectTrigger id="parentGroup">
                      <SelectValue placeholder="Select a group (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {ingredients
                        .filter((ing) => ing.type === 'group')
                        .map((group) => (
                          <SelectItem
                            key={group.id}
                            value={group.id.toString()}
                          >
                            {group.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                Image
              </h3>
              <div className="flex items-start gap-4">
                {watch('imagePreview') ? (
                  <div className="relative h-28 w-28 shrink-0">
                    <img
                      src={watch('imagePreview') ?? undefined}
                      alt="Ingredient preview"
                      className="h-full w-full rounded-lg border-2 border-border object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 size-7"
                      onClick={() => {
                        setValue('image', null);
                        setValue('imagePreview', null);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-28 w-full max-w-xs shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-primary-tint">
                    <div className="flex flex-col items-center justify-center px-3 py-2">
                      <ImageIcon
                        size={24}
                        className="mb-1.5 text-foreground-muted"
                      />
                      <p className="text-center text-sm text-foreground-muted">
                        <span className="font-semibold">Click to upload</span>
                        <br />
                        PNG, JPG (max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setValue('image', file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setValue(
                              'imagePreview',
                              typeof reader.result === 'string'
                                ? reader.result
                                : null,
                            );
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
                {editingIngredient?.hasImage && !watch('imagePreview') && (
                  <div className="mt-2 flex items-center gap-2">
                    <Checkbox
                      id="removeImage"
                      checked={watch('removeImage')}
                      onCheckedChange={(checked) =>
                        setValue('removeImage', Boolean(checked))
                      }
                    />
                    <Label
                      htmlFor="removeImage"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Remove existing image
                    </Label>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                Ingredient Type
              </h3>
              <Tabs
                value={watch('type')}
                onValueChange={(value) => setValue('type', value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual" className="gap-2">
                    <span>Manual</span>
                  </TabsTrigger>
                  <TabsTrigger value="automated" className="gap-2">
                    <span>Automated</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-sm text-foreground-muted">
                {watch('type') === 'manual'
                  ? 'Manually added ingredients (e.g., garnishes, ice)'
                  : 'Automated dispensing via pump system'}
              </p>
            </div>

            <div className="space-y-3 rounded-lg bg-surface-sunken p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                Properties
              </h3>
              {watch('type') === 'manual' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="alcoholContent"
                      className="text-sm font-medium"
                    >
                      Alcohol Content (%) <span className="text-danger">*</span>
                    </Label>
                    <Input
                      id="alcoholContent"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g., 40"
                      {...register('alcoholContent', {
                        required: true,
                        valueAsNumber: true,
                        min: 0,
                        max: 100,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium">
                      Unit <span className="text-danger">*</span>
                    </Label>
                    <Select
                      value={watch('unit')}
                      onValueChange={(value) => setValue('unit', value ?? 'ml')}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml">Milliliter (ml)</SelectItem>
                        <SelectItem value="cl">Centiliter (cl)</SelectItem>
                        <SelectItem value="oz">Ounce (oz)</SelectItem>
                        <SelectItem value="dash">Dash</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="alcoholContentAuto"
                        className="text-sm font-medium"
                      >
                        Alcohol Content (%){' '}
                        <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="alcoholContentAuto"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g., 40"
                        {...register('alcoholContent', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                          max: 100,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="bottleSize"
                        className="text-sm font-medium"
                      >
                        Bottle Size (ml) <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="bottleSize"
                        type="number"
                        step="1"
                        min="0"
                        placeholder="e.g., 750"
                        {...register('bottleSize', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="pumpTimeMultiplier"
                      className="text-sm font-medium"
                    >
                      Pump Time Multiplier{' '}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      id="pumpTimeMultiplier"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g., 1.0"
                      {...register('pumpTimeMultiplier', {
                        required: true,
                        valueAsNumber: true,
                        min: 0,
                      })}
                    />
                    <p className="text-sm text-foreground-muted">
                      Adjusts pump timing for viscosity differences
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none">
              {editingIngredient ? 'Update Ingredient' : 'Add Ingredient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
