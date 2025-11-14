import React from 'react';
import { Edit, Trash2, Heart } from 'lucide-react';

const RecipeCard = ({ recipe, isFavorite, onEdit, onDelete }) => {
  const handleEditClick = () => {
    onEdit(recipe);
  };

  const handleDeleteClick = () => {
    onDelete(recipe.id);
  };

  return (
    <div className="card bg-base-100 shadow-sm hover:shadow-lg transition-transform transition-shadow duration-200 hover:-translate-y-1 border border-base-200 rounded-xl overflow-hidden">
      <figure className="relative w-full aspect-[4/3] rounded-t-lg overflow-hidden bg-base-200">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
            <span className="text-base-content/40 text-sm font-medium">
              No image
            </span>
          </div>
        )}
        {isFavorite && (
          <div className="absolute top-2 right-2">
            <div className="badge badge-error gap-1">
              <Heart size={12} fill="currentColor" />
            </div>
          </div>
        )}
      </figure>

      <div className="card-body p-4">
        <h3 className="card-title text-base font-bold text-base-content/90 line-clamp-1">
          {recipe.name}
        </h3>
        {recipe.description && (
          <p className="text-sm text-base-content/70 line-clamp-2">
            {recipe.description}
          </p>
        )}
        
        <div className="text-xs text-base-content/60 mt-2">
          {recipe.productionSteps?.length || 0} step{recipe.productionSteps?.length !== 1 ? 's' : ''}
        </div>

        <div className="card-actions justify-end mt-4 pt-4 border-t border-base-200">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleEditClick}
          >
            <Edit size={16} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-error"
            onClick={handleDeleteClick}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RecipeCard);
