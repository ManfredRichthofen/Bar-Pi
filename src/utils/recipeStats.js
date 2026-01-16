/**
 * Calculate recipe statistics including volume, ABV, and ingredient counts
 * @param {Object} recipe - Recipe object with ingredients array
 * @returns {Object} Recipe statistics
 */
export const calculateRecipeStats = (recipe) => {
  if (!recipe || !recipe.ingredients) {
    return {
      automatedIngredients: 0,
      manualIngredients: 0,
      estimatedABV: '0.0',
      totalVolume: 0
    };
  }

  console.log('Recipe ingredients data:', recipe.ingredients);

  const automatedIngredients = recipe.ingredients.filter(ing => ing.type === 'automated').length || 0;
  const manualIngredients = recipe.ingredients.filter(ing => ing.type === 'manual').length || 0;
  
  // Calculate total volume by summing all ingredient amounts
  const totalVolume = recipe.ingredients.reduce((sum, ing) => {
    console.log('Processing ingredient:', ing);
    if (!ing.amount) {
      console.log('No amount for ingredient:', ing.name);
      return sum;
    }
    // Convert to ml: cl to ml (multiply by 10), ml stays the same
    const amountMl = ing.unit === 'cl' ? ing.amount * 10 : ing.amount;
    console.log(`Ingredient ${ing.name}: ${ing.amount} ${ing.unit} = ${amountMl}ml`);
    return sum + amountMl;
  }, 0);
  
  // Calculate total alcohol content (pure alcohol volume in ml)
  const totalAlcoholContent = recipe.ingredients.reduce((sum, ing) => {
    if (ing.alcoholContent && ing.amount) {
      const amountMl = ing.unit === 'cl' ? ing.amount * 10 : ing.amount;
      // Pure alcohol volume = ingredient volume * (ABV / 100)
      const alcoholVolume = amountMl * ing.alcoholContent / 100;
      console.log(`Alcohol content for ${ing.name}: ${amountMl}ml × ${ing.alcoholContent}% = ${alcoholVolume}ml pure alcohol`);
      return sum + alcoholVolume;
    }
    return sum;
  }, 0);
  
  // Calculate ABV: (total alcohol volume / total drink volume) * 100
  const estimatedABV = totalVolume > 0 ? (totalAlcoholContent / totalVolume) * 100 : 0;
  
  console.log('Final calculation:', {
    totalVolume,
    totalAlcoholContent,
    estimatedABV,
    automatedIngredients,
    manualIngredients
  });
  
  return {
    automatedIngredients,
    manualIngredients,
    estimatedABV: estimatedABV.toFixed(1),
    totalVolume: Math.round(totalVolume)
  };
};
