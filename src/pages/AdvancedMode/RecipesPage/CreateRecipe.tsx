import type React from 'react';
import { RecipeForm } from './components/RecipeForm';

export const NewRecipePage: React.FC = () => {
  return <RecipeForm mode="create" />;
};
