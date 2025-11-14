import React from 'react';
import { X, Trash2, Image as ImageIcon } from 'lucide-react';

const RecipeModal = ({
  isVisible,
  onClose,
  editingRecipe,
  formData,
  setFormData,
  ingredients,
  glasses,
  onSave,
  onImageChange,
  addProductionStep,
  removeProductionStep,
  updateProductionStep,
  addIngredientToStep,
  removeIngredientFromStep,
  updateStepIngredient,
}) => {
  if (!isVisible) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h3 className="text-xl font-bold">
            {editingRecipe ? 'Edit Recipe' : 'Add Recipe'}
          </h3>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Recipe Name *</span>
              </label>
              <input
                type="text"
                placeholder="Enter recipe name"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Default Glass</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.defaultGlass?.id || ''}
                onChange={(e) => {
                  const glass = glasses.find(g => g.id === parseInt(e.target.value));
                  setFormData(prev => ({ ...prev, defaultGlass: glass || null }));
                }}
              >
                <option value="">Select a glass</option>
                {glasses.map((glass) => (
                  <option key={glass.id} value={glass.id}>
                    {glass.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder="Enter recipe description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            ></textarea>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Default Amount (ml)</span>
            </label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={formData.defaultAmountToFill}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultAmountToFill: parseInt(e.target.value) || 0 }))}
            />
          </div>

          {/* Image Upload */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Recipe Image</span>
            </label>
            <div className="flex items-center gap-4">
              {formData.imagePreview ? (
                <div className="relative w-32 h-32">
                  <img
                    src={formData.imagePreview}
                    alt="Recipe preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    className="btn btn-circle btn-xs absolute -top-2 -right-2 bg-base-100"
                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-base-200">
                  <div className="flex flex-col items-center justify-center p-3">
                    <ImageIcon size={24} className="mb-2" />
                    <p className="text-xs text-center">
                      <span className="font-semibold">Upload</span>
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onImageChange}
                  />
                </label>
              )}
              {editingRecipe?.hasImage && !formData.imagePreview && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={formData.removeImage}
                    onChange={(e) => setFormData(prev => ({ ...prev, removeImage: e.target.checked }))}
                  />
                  <span className="text-sm">Remove existing image</span>
                </div>
              )}
            </div>
          </div>

          {/* Production Steps */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg">Production Steps</h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => addProductionStep('addIngredients')}
                >
                  + Add Ingredients
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => addProductionStep('writtenInstruction')}
                >
                  + Add Instruction
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.productionSteps.map((step, stepIndex) => (
                <div key={stepIndex} className="card bg-base-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">
                      Step {stepIndex + 1}: {step.type === 'addIngredients' ? 'Add Ingredients' : 'Instruction'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => removeProductionStep(stepIndex)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {step.type === 'addIngredients' ? (
                    <div className="space-y-2">
                      {step.stepIngredients.map((ing, ingIndex) => (
                        <div key={ingIndex} className="flex gap-2 items-center">
                          <select
                            className="select select-bordered select-sm flex-1"
                            value={ing.ingredient?.id || ''}
                            onChange={(e) => {
                              const ingredient = ingredients.find(i => i.id === parseInt(e.target.value));
                              updateStepIngredient(stepIndex, ingIndex, 'ingredient', ingredient);
                            }}
                          >
                            <option value="">Select ingredient</option>
                            {ingredients.map((ingredient) => (
                              <option key={ingredient.id} value={ingredient.id}>
                                {ingredient.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            className="input input-bordered input-sm w-20"
                            value={ing.amount}
                            onChange={(e) => updateStepIngredient(stepIndex, ingIndex, 'amount', parseFloat(e.target.value) || 0)}
                          />
                          <select
                            className="select select-bordered select-sm w-20"
                            value={ing.scale}
                            onChange={(e) => updateStepIngredient(stepIndex, ingIndex, 'scale', e.target.value)}
                          >
                            <option value="ml">ml</option>
                            <option value="cl">cl</option>
                            <option value="oz">oz</option>
                            <option value="dash">dash</option>
                          </select>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-circle"
                            onClick={() => removeIngredientFromStep(stepIndex, ingIndex)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost w-full"
                        onClick={() => addIngredientToStep(stepIndex)}
                      >
                        + Add Ingredient
                      </button>
                    </div>
                  ) : (
                    <textarea
                      className="textarea textarea-bordered w-full"
                      placeholder="Enter instruction"
                      value={step.message || ''}
                      onChange={(e) => updateProductionStep(stepIndex, { ...step, message: e.target.value })}
                    ></textarea>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-action pt-6 border-t mt-6">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSave}
          >
            {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default RecipeModal;
