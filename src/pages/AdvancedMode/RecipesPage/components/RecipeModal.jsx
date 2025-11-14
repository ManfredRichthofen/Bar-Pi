import React, { memo } from 'react';
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
      <div className="modal-box max-w-5xl max-h-[90vh] overflow-hidden p-0 flex flex-col bg-base-100/95 backdrop-blur">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200/80 bg-base-100/80">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">
              {editingRecipe ? 'Edit recipe' : 'Create recipe'}
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              Define the basics, image and production steps for this drink.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-xs uppercase tracking-wide text-base-content/70">Recipe name *</span>
              </label>
              <input
                type="text"
                placeholder="Enter recipe name"
                className="input input-bordered w-full input-md"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-xs uppercase tracking-wide text-base-content/70">Default glass</span>
              </label>
              <select
                className="select select-bordered w-full select-md"
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
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-xs uppercase tracking-wide text-base-content/70">Default amount (ml)</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full input-md"
                value={formData.defaultAmountToFill}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultAmountToFill: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium text-xs uppercase tracking-wide text-base-content/70">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered textarea-md w-full min-h-[5.5rem] max-h-40 bg-base-100/90 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              placeholder="Describe the drink, flavor profile or any notes for the bartender"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            ></textarea>
          </div>

          {/* Image Upload */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium text-xs uppercase tracking-wide text-base-content/70">Recipe image</span>
            </label>
            <div className="flex flex-wrap items-center gap-4">
              {formData.imagePreview ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-sm">
                  <img
                    src={formData.imagePreview}
                    alt="Recipe preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    className="btn btn-circle btn-xs absolute -top-2 -right-2 bg-base-100 shadow-sm"
                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-base-300 rounded-xl cursor-pointer hover:bg-base-200/70 transition-colors">
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
          <div className="border-t border-base-200 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="font-semibold text-base">Production steps</h4>
                <p className="text-xs text-base-content/60 mt-1">
                  Build the drink using ingredient steps and written instructions.
                </p>
              </div>
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
                <div key={stepIndex} className="card bg-base-100/90 border border-base-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
                    <span className="font-medium text-sm">
                      Step {stepIndex + 1} · {step.type === 'addIngredients' ? 'Add ingredients' : 'Instruction'}
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
                    <div className="space-y-2 px-4 pb-4 pt-1">
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
                        className="btn btn-sm btn-ghost w-full mt-1"
                        onClick={() => addIngredientToStep(stepIndex)}
                      >
                        + Add Ingredient
                      </button>
                    </div>
                  ) : (
                    <textarea
                      className="textarea textarea-bordered w-full rounded-b-xl border-t-0"
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

        {/* Footer */}
        <div className="modal-action px-6 py-4 border-t border-base-200 bg-base-100/80 mt-0">
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
            {editingRecipe ? 'Update recipe' : 'Create recipe'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default memo(RecipeModal);
