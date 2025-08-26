import React from "react";
import { XCircle, AlertCircle, CheckCircle } from "lucide-react";

const SimpleIngredientRequirements = ({ requiredIngredients }) => {
	const isAutomatedIngredient = (ingredient) => {
		return ingredient && ingredient.type === "automated";
	};

	const isManualIngredient = (ingredient) => {
		return (
			ingredient &&
			(ingredient.type === "manual" ||
				ingredient.type === "group" ||
				ingredient.type === "ingredient")
		);
	};

	const isRequiredIngredient = (item) => {
		return item && item.amountRequired > 0;
	};

	const automaticIngredients = requiredIngredients.filter(
		(x) => isAutomatedIngredient(x.ingredient) && isRequiredIngredient(x),
	);

	const manualIngredients = requiredIngredients.filter(
		(x) => isManualIngredient(x.ingredient) && isRequiredIngredient(x),
	);

	const hasUnavailableIngredients = requiredIngredients.some(
		(x) =>
			x.amountMissing > 0 ||
			(!x.ingredient.onPump && x.ingredient.type === "automated"),
	);

	if (requiredIngredients.length === 0) {
		return null;
	}

	return (
		<div className="space-y-6">
			{/* Automated Ingredients Section */}
			{automaticIngredients.length > 0 && (
				<div>
					<div className="flex items-center gap-2 mb-4">
						<h3 className="font-semibold text-base">Automated Ingredients</h3>
						<CheckCircle className="w-4 h-4 text-success" />
					</div>
					<div className="space-y-3">
						{automaticIngredients.map((item, index) => (
							<div
								key={index}
								className={`flex justify-between items-center w-full p-4 rounded-lg ${
									item.amountMissing > 0 || !item.ingredient.onPump
										? "bg-error/10 border border-error/20"
										: "bg-success/10 border border-success/20"
								}`}
							>
								<div className="flex-1 pr-3">
									<span className="break-words font-medium">
										{item.ingredient.name}
									</span>
									{(item.amountMissing > 0 || !item.ingredient.onPump) && (
										<div className="flex items-center gap-1 mt-1">
											<XCircle className="w-3 h-3 text-error" />
											<span className="text-error text-xs">
												{item.amountMissing > 0
													? `Missing: ${item.amountMissing} ${item.ingredient.unit}`
													: "Not on pump system"}
											</span>
										</div>
									)}
								</div>
								<div className="text-right shrink-0">
									<span className="font-semibold whitespace-nowrap">
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
					<div className="flex items-center gap-2 mb-4">
						<h3 className="font-semibold text-base">Manual Ingredients</h3>
						<AlertCircle className="text-warning" size={16} />
					</div>
					<div className="space-y-3">
						{manualIngredients.map((item, index) => (
							<div
								key={index}
								className={`flex justify-between items-center w-full p-4 rounded-lg ${
									!item.ingredient.inBar
										? "bg-warning/10 border border-warning/20"
										: "bg-base-200 border border-base-300"
								}`}
							>
								<div className="flex-1 pr-3">
									<span className="break-words font-medium">
										{item.ingredient.name}
									</span>
									{!item.ingredient.inBar && (
										<div className="flex items-center gap-1 mt-1">
											<AlertCircle className="w-3 h-3 text-warning" />
											<span className="text-warning text-xs">Add manually</span>
										</div>
									)}
								</div>
								<div className="text-right shrink-0">
									<span className="font-semibold whitespace-nowrap">
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
					<div className="alert alert-warning">
						<AlertCircle size={16} />
						<span className="break-words">
							Could not determine ingredient types. Please check the recipe
							configuration.
						</span>
					</div>
				)}
		</div>
	);
};

export default SimpleIngredientRequirements;
