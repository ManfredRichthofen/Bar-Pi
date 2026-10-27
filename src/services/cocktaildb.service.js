import axios from 'axios';

const COCKTAILDB_API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

const COCKTAILDB_INGREDIENT_IMAGE_BASE =
  'https://www.thecocktaildb.com/images/ingredients';

// Separate instance so the global interceptors (backend baseURL + Bearer token)
// are not applied; TheCocktailDB's CORS policy rejects the Authorization header.
const http = axios.create({ timeout: 15000 });

const UNICODE_FRACTIONS = {
  '½': ' 1/2',
  '⅓': ' 1/3',
  '⅔': ' 2/3',
  '¼': ' 1/4',
  '¾': ' 3/4',
  '⅛': ' 1/8',
};

// Units the step editor understands, keyed by the words CocktailDB uses.
// `factor` converts the parsed quantity into the target scale.
const UNITS = {
  ml: { scale: 'milliliter', factor: 1 },
  milliliter: { scale: 'milliliter', factor: 1 },
  milliliters: { scale: 'milliliter', factor: 1 },
  cl: { scale: 'milliliter', factor: 10 },
  dl: { scale: 'milliliter', factor: 100 },
  l: { scale: 'milliliter', factor: 1000 },
  liter: { scale: 'milliliter', factor: 1000 },
  litre: { scale: 'milliliter', factor: 1000 },
  oz: { scale: 'milliliter', factor: 30 },
  ounce: { scale: 'milliliter', factor: 30 },
  ounces: { scale: 'milliliter', factor: 30 },
  part: { scale: 'milliliter', factor: 30 },
  parts: { scale: 'milliliter', factor: 30 },
  shot: { scale: 'milliliter', factor: 45 },
  shots: { scale: 'milliliter', factor: 45 },
  jigger: { scale: 'milliliter', factor: 45 },
  jiggers: { scale: 'milliliter', factor: 45 },
  pony: { scale: 'milliliter', factor: 30 },
  cup: { scale: 'milliliter', factor: 240 },
  cups: { scale: 'milliliter', factor: 240 },
  pint: { scale: 'milliliter', factor: 473 },
  pints: { scale: 'milliliter', factor: 473 },
  dash: { scale: 'milliliter', factor: 1 },
  dashes: { scale: 'milliliter', factor: 1 },
  splash: { scale: 'milliliter', factor: 5 },
  splashes: { scale: 'milliliter', factor: 5 },
  drop: { scale: 'milliliter', factor: 0.05 },
  drops: { scale: 'milliliter', factor: 0.05 },
  tsp: { scale: 'teaspoons', factor: 1 },
  teaspoon: { scale: 'teaspoons', factor: 1 },
  teaspoons: { scale: 'teaspoons', factor: 1 },
  spoon: { scale: 'teaspoons', factor: 1 },
  spoons: { scale: 'teaspoons', factor: 1 },
  barspoon: { scale: 'teaspoons', factor: 1 },
  barspoons: { scale: 'teaspoons', factor: 1 },
  tbsp: { scale: 'tablespoons', factor: 1 },
  tblsp: { scale: 'tablespoons', factor: 1 },
  tbl: { scale: 'tablespoons', factor: 1 },
  tablespoon: { scale: 'tablespoons', factor: 1 },
  tablespoons: { scale: 'tablespoons', factor: 1 },
  g: { scale: 'grams', factor: 1 },
  gr: { scale: 'grams', factor: 1 },
  gram: { scale: 'grams', factor: 1 },
  grams: { scale: 'grams', factor: 1 },
  kg: { scale: 'grams', factor: 1000 },
};

const NUMBER = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)`;
const QUANTITY_REGEX = new RegExp(
  String.raw`${NUMBER}(?:\s*(?:-|to)\s*${NUMBER})?`,
);

function parseNumber(value) {
  const [whole, fraction] = value.includes(' ')
    ? value.split(/\s+/)
    : [null, value];
  let result = whole ? Number(whole) : 0;
  if (fraction.includes('/')) {
    const [num, den] = fraction.split('/').map(Number);
    result += den ? num / den : 0;
  } else {
    result += Number(fraction.replace(',', '.'));
  }
  return result;
}

function roundAmount(amount, scale) {
  if (scale === 'milliliter') {
    return Math.max(1, Math.round(amount));
  }
  return Math.round(amount * 100) / 100;
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

class CocktailDBService {
  /**
   * Search cocktails by name
   * @param {string} searchTerm - The search term
   * @returns {Promise<Array>} Array of cocktail results
   */
  async searchCocktails(searchTerm) {
    try {
      const response = await http.get(`${COCKTAILDB_API_BASE}/search.php`, {
        params: { s: searchTerm },
      });
      return response.data.drinks || [];
    } catch (error) {
      console.error('Failed to search cocktails:', error);
      throw error;
    }
  }

  /**
   * Get cocktail by ID
   * @param {string} id - The cocktail ID
   * @returns {Promise<Object>} Cocktail details
   */
  async getCocktailById(id) {
    try {
      const response = await http.get(`${COCKTAILDB_API_BASE}/lookup.php`, {
        params: { i: id },
      });
      return response.data.drinks?.[0] || null;
    } catch (error) {
      console.error('Failed to get cocktail:', error);
      throw error;
    }
  }

  /**
   * Get random cocktail
   * @returns {Promise<Object>} Random cocktail
   */
  async getRandomCocktail() {
    try {
      const response = await http.get(`${COCKTAILDB_API_BASE}/random.php`);
      return response.data.drinks?.[0] || null;
    } catch (error) {
      console.error('Failed to get random cocktail:', error);
      throw error;
    }
  }

  /**
   * Convert CocktailDB cocktail to internal recipe format
   * @param {Object} cocktail - CocktailDB cocktail object
   * @returns {Object} Recipe in internal format
   */
  convertToRecipeFormat(cocktail) {
    if (!cocktail) return null;

    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const name = cocktail[`strIngredient${i}`]?.trim();
      if (!name) continue;

      const measure = cocktail[`strMeasure${i}`]?.trim() || '';
      const parsed = this.parseMeasurement(measure);
      const garnish = /garnish/i.test(measure);

      // CocktailDB repeats an ingredient when it is also used as a garnish
      // (e.g. "Watermelon" / "Garnish with"); merge same-unit quantities.
      const existing = ingredients.find(
        (ing) =>
          normalizeName(ing.name) === normalizeName(name) &&
          !!ing.amount === !!parsed &&
          ing.garnish === garnish &&
          (!parsed || ing.scale === parsed.unit),
      );
      if (existing) {
        if (parsed) {
          existing.amount = roundAmount(
            existing.amount + parsed.amount,
            existing.scale,
          );
        }
        existing.measure = [existing.measure, measure]
          .filter(Boolean)
          .join(' + ');
        continue;
      }

      ingredients.push({
        name,
        measure,
        amount: parsed?.amount ?? null,
        scale: parsed?.unit ?? null,
        garnish,
      });
    }

    return {
      name: cocktail.strDrink,
      description: cocktail.strInstructions || '',
      category: cocktail.strCategory,
      alcoholic: cocktail.strAlcoholic === 'Alcoholic',
      glass: cocktail.strGlass,
      imageUrl: cocktail.strDrinkThumb,
      ingredients: ingredients,
      instructions: cocktail.strInstructions,
      tags: cocktail.strTags
        ? cocktail.strTags.split(',').map((t) => t.trim())
        : [],
      cocktailDbId: cocktail.idDrink,
      dateModified: cocktail.dateModified,
    };
  }

  /**
   * Look up ingredient details (type, alcohol, ABV) by name
   * @param {string} name - Ingredient name
   * @returns {Promise<Object|null>} CocktailDB ingredient or null
   */
  async getIngredientByName(name) {
    try {
      const response = await http.get(`${COCKTAILDB_API_BASE}/search.php`, {
        params: { i: name },
      });
      return response.data.ingredients?.[0] || null;
    } catch (error) {
      console.error('Failed to look up ingredient:', error);
      return null;
    }
  }

  /**
   * @param {string} name - Ingredient name
   * @returns {string} URL of the CocktailDB ingredient image
   */
  getIngredientImageUrl(name) {
    return `${COCKTAILDB_INGREDIENT_IMAGE_BASE}/${encodeURIComponent(name)}-Medium.png`;
  }

  /**
   * Normalize an ingredient name for loose comparisons
   * ("Lime Juice" === "lime-juice")
   * @param {string} name
   * @returns {string}
   */
  normalizeName(name) {
    return normalizeName(name || '');
  }

  /**
   * Download image from URL as blob
   * @param {string} imageUrl - The image URL
   * @returns {Promise<Blob>} Image blob
   */
  async downloadImage(imageUrl) {
    try {
      const response = await http.get(imageUrl, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw error;
    }
  }

  /**
   * Parse a CocktailDB measurement string into an amount and step scale.
   * Handles mixed numbers ("1 1/2 oz"), decimals ("4.5 cl"), ranges
   * ("1-2 dashes"), unicode fractions and unit-less counts ("5" mint leaves,
   * "Juice of 1/2" lime).
   * @param {string} measure - Measurement string (e.g., "1 oz", "2 cl", "1/2 tsp")
   * @returns {{ amount: number, unit: string } | null} null when the measure
   *   has no quantity (e.g. "Garnish with", "Top up", empty)
   */
  parseMeasurement(measure) {
    if (!measure || !measure.trim()) return null;

    let cleaned = measure.toLowerCase();
    for (const [symbol, replacement] of Object.entries(UNICODE_FRACTIONS)) {
      cleaned = cleaned.replaceAll(symbol, replacement);
    }
    cleaned = cleaned.replace(/fl\.?\s*oz/g, 'oz').trim();

    const match = cleaned.match(QUANTITY_REGEX);
    if (!match) return null;

    const quantity = parseNumber(match[1]);
    if (!quantity || !Number.isFinite(quantity)) return null;

    const words = (
      cleaned.slice(0, match.index) +
      ' ' +
      cleaned.slice(match.index + match[0].length)
    )
      .split(/[^a-z]+/)
      .filter(Boolean);

    const unit = words.map((word) => UNITS[word]).find(Boolean);
    if (unit) {
      return {
        amount: roundAmount(quantity * unit.factor, unit.scale),
        unit: unit.scale,
      };
    }

    // Bare counts: "2" eggs, "5" mint leaves, "1 slice", "Juice of 1/2"
    return { amount: roundAmount(quantity, 'pieces'), unit: 'pieces' };
  }
}

export default new CocktailDBService();
