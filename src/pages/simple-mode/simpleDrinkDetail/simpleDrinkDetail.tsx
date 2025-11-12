import { useNavigate, useLocation } from "@tanstack/react-router";
import { Beaker, ArrowLeft } from "lucide-react";
import DrinkImage from "./components/DrinkImage";
import IngredientsList from "./components/IngredientsList";
import DrinkInfo from "./components/DrinkInfo";

interface Ingredient {
	name: string;
	amount: number;
	unit: string;
}

interface Glass {
	name: string;
	sizeInMl: number;
}

interface Recipe {
	id: string;
	name: string;
	description?: string;
	image?: string;
	alcoholic: boolean;
	defaultGlass?: Glass;
	ingredients: Ingredient[];
}

const SimpleDrinkDetail = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const recipe = (location.state as any)?.recipe as Recipe | undefined;

	// Redirect if no recipe data
	if (!recipe) {
		navigate({ to: "/simple/drinks" });
		return null;
	}

	const handleMakeDrink = () => {
		navigate({ to: "/simple/order", state: { recipe } as any });
	};

	const handleBack = () => {
		navigate({ to: "/simple/drinks" });
	};

	return (
		<div className="min-h-screen bg-base-100 flex flex-col">
			{/* Header */}
			<div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
				<div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
					<button
						type="button"
						onClick={handleBack}
						className="btn btn-ghost btn-sm p-2 sm:p-3 hover:bg-base-200 rounded-xl transition-all duration-200"
					>
						<ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
					</button>
					<h1 className="text-base sm:text-lg font-bold truncate flex-1 mx-2 sm:mx-3 text-center">
						{recipe.name}
					</h1>
					{recipe.alcoholic && (
						<div className="badge badge-error badge-xs sm:badge-sm shrink-0">21+</div>
					)}
				</div>
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
					{/* Image */}
					<DrinkImage image={recipe.image} name={recipe.name} />

					{/* Description and Info */}
					<DrinkInfo
						description={recipe.description}
						alcoholic={recipe.alcoholic}
						defaultGlass={recipe.defaultGlass}
					/>

					{/* Ingredients */}
					<IngredientsList ingredients={recipe.ingredients} />
				</div>
			</div>

			{/* Fixed bottom action button */}
			<div className="bg-base-100/95 backdrop-blur-md border-t border-base-200 p-3 sm:p-4 shadow-lg">
				<button
					type="button"
					onClick={handleMakeDrink}
					className="btn btn-primary w-full h-12 sm:h-14 gap-2 sm:gap-3 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
				>
					<Beaker className="w-4 h-4 sm:w-5 sm:h-5" />
					Make Drink
				</button>
			</div>
		</div>
	);
};

export default SimpleDrinkDetail;
