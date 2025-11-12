import { XCircle, AlertCircle, CheckCircle } from "lucide-react";

interface Ingredient {
	id: string;
	name: string;
	type: string;
	unit: string;
	onPump?: boolean;
	inBar?: boolean;
}

interface RequiredIngredient {
	ingredient: Ingredient;
	amountRequired: number;
	amountMissing: number;
}

interface IngredientRequirementsProps {
	requiredIngredients: RequiredIngredient[];
}

const IngredientRequirements = ({ requiredIngredients }: IngredientRequirementsProps) => {
	const isAutomatedIngredient = (ingredient: Ingredient) => {
		return ingredient && ingredient.type === "automated";
	};

	const isManualIngredient = (ingredient: Ingredient) => {
		return (
			ingredient &&
			(ingredient.type === "manual" ||
				ingredient.type === "group" ||
				ingredient.type === "ingredient")
		);
	};

	const isRequiredIngredient = (item: RequiredIngredient) => {
		return item && item.amountRequired > 0;
	};

	const automaticIngredients = requiredIngredients.filter(
		(x) => isAutomatedIngredient(x.ingredient) && isRequiredIngredient(x),
	);

	const manualIngredients = requiredIngredients.filter(
		(x) => isManualIngredient(x.ingredient) && isRequiredIngredient(x),
	);

	if (requiredIngredients.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Automated Ingredients Section */}
			{automaticIngredients.length > 0 && (
				<div>
					<div className="flex items-center gap-2 mb-3 sm:mb-4">
						<h3 className="font-semibold text-sm sm:text-base">Automated Ingredients</h3>
						<CheckCircle className="w-4 h-4 text-success" />
					</div>
					<div className="space-y-2 sm:space-y-3">
						{automaticIngredients.map((item) => (
							<div
								key={item.ingredient.id}
								className={`flex justify-between items-center w-full p-3 sm:p-4 rounded-lg transition-colors ${
									item.amountMissing > 0 || !item.ingredient.onPump
										? "bg-error/10 border border-error/20"
										: "bg-success/10 border border-success/20"
								}`}
							>
								<div className="flex-1 pr-2 sm:pr-3 min-w-0">
									<span className="break-words font-medium text-sm sm:text-base block">
										{item.ingredient.name}
									</span>
									{(item.amountMissing > 0 || !item.ingredient.onPump) && (
										<div className="flex items-center gap-1 mt-1">
											<XCircle className="w-3 h-3 text-error shrink-0" />
											<span className="text-error text-xs">
												{item.amountMissing > 0
													? `Missing: ${item.amountMissing} ${item.ingredient.unit}`
													: "Not on pump system"}
											</span>
										</div>
									)}
								</div>
								<div className="text-right shrink-0">
									<span className="font-semibold whitespace-nowrap text-sm sm:text-base">
										{item.amountRequired} {item.ingredient.unit}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Manual Ingredients Section */}
			{manualIngredients.length > 0 && (
				<div>
					<div className="flex items-center gap-2 mb-3 sm:mb-4">
						<h3 className="font-semibold text-sm sm:text-base">Manual Ingredients</h3>
						<AlertCircle className="text-warning" size={16} />
					</div>
					<div className="space-y-2 sm:space-y-3">
						{manualIngredients.map((item) => (
							<div
								key={item.ingredient.id}
								className={`flex justify-between items-center w-full p-3 sm:p-4 rounded-lg transition-colors ${
									!item.ingredient.inBar
										? "bg-warning/10 border border-warning/20"
										: "bg-base-200 border border-base-300"
								}`}
							>
								<div className="flex-1 pr-2 sm:pr-3 min-w-0">
									<span className="break-words font-medium text-sm sm:text-base block">
										{item.ingredient.name}
									</span>
									{!item.ingredient.inBar && (
										<div className="flex items-center gap-1 mt-1">
											<AlertCircle className="w-3 h-3 text-warning shrink-0" />
											<span className="text-warning text-xs">Add manually</span>
										</div>
									)}
								</div>
								<div className="text-right shrink-0">
									<span className="font-semibold whitespace-nowrap text-sm sm:text-base">
										{item.amountRequired} {item.ingredient.unit}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Warning for unknown ingredients */}
			{requiredIngredients.length > 0 &&
				automaticIngredients.length === 0 &&
				manualIngredients.length === 0 && (
					<div className="alert alert-warning text-sm sm:text-base">
						<AlertCircle size={16} className="shrink-0" />
						<span className="break-words">
							Could not determine ingredient types. Please check the recipe
							configuration.
						</span>
					</div>
				)}
		</div>
	);
};

export default IngredientRequirements;
