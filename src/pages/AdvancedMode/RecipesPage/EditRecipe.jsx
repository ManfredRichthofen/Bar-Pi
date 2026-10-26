import { useParams } from '@tanstack/react-router';
import React from 'react';
import { RecipeForm } from './components/RecipeForm';

const RecipeEditPage = () => {
  const params = useParams({ strict: false });
  const recipeId = params?.recipeId;

  return <RecipeForm mode="edit" recipeId={recipeId} />;
};

export default RecipeEditPage;
