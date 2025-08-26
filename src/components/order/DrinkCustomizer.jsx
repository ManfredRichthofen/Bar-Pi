import React, { useState } from "react";
import { PlusCircle } from "lucide-react";

const DrinkCustomizer = ({
	disableBoosting = false,
	customizations,
	onCustomizationsChange,
	availableIngredients = [],
}) => {
	const [addingIngredient, setAddingIngredient] = useState(false);
	const [selectedIngredient, setSelectedIngredient] = useState(null);

	const handleBoostChange = (event) => {
		onCustomizationsChange({
			...customizations,
			boost: parseInt(event.target.value),
		});
	};

	const handleAdditionalIngredientAmountChange = (ingredientId, amount) => {
		const updatedIngredients = customizations.additionalIngredients.map(
			(ing) => (ing.ingredient.id === ingredientId ? { ...ing, amount } : ing),
		);
		onCustomizationsChange({
			...customizations,
			additionalIngredients: updatedIngredients,
		});
	};

	const handleAddIngredient = () => {
		if (!selectedIngredient) return;

		const exists = customizations.additionalIngredients.some(
			(ing) => ing.ingredient.id === selectedIngredient.id,
		);

		if (!exists) {
			onCustomizationsChange({
				...customizations,
				additionalIngredients: [
					...customizations.additionalIngredients,
					{
						ingredient: selectedIngredient,
						amount: 0,
						manualAdd: true,
					},
				],
			});
		}

		setSelectedIngredient(null);
		setAddingIngredient(false);
	};

	return (
		<div className="card bg-base-100 shadow-xl mb-6">
			<div className="card-body">
				<div className="collapse collapse-arrow">
					<input type="checkbox" className="peer" />
					<div className="collapse-title text-xl font-medium peer-checked:bg-base-200">
						Customize Drink
					</div>
					<div className="collapse-content peer-checked:bg-base-200">
						<div className="mb-6">
							<h3 className="text-lg font-bold mb-2">
								Alcohol Content Adjustment
							</h3>
							{disableBoosting ? (
								<div className="alert alert-warning mb-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="stroke-current shrink-0 h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<span>This drink's strength cannot be adjusted</span>
								</div>
							) : (
								<p className="text-base-content/70 mb-2">
									Adjust the strength of your drink by modifying the alcohol
									content
								</p>
							)}
							<div className="flex items-center gap-4">
								<input
									type="range"
									min={0}
									max={200}
									value={customizations.boost}
									onChange={handleBoostChange}
									step={10}
									className={`range flex-1 ${disableBoosting ? "opacity-50" : ""}`}
									disabled={disableBoosting}
								/>
								<div
									className={`badge badge-lg ${disableBoosting ? "opacity-50" : ""}`}
								>
									{customizations.boost === 100
										? "Normal"
										: `${customizations.boost > 100 ? "+" : ""}${customizations.boost - 100}%`}
								</div>
							</div>
							<div
								className={`w-full flex justify-between text-xs px-2 mt-1 text-base-content/70 ${disableBoosting ? "opacity-50" : ""}`}
							>
								<span>No Alcohol</span>
								<span>Normal</span>
								<span>Double</span>
							</div>
						</div>

						<div>
							<h3 className="text-lg font-bold mb-2">Additional Ingredients</h3>
							<p className="text-base-content/70 mb-4">
								Add extra ingredients to customize your drink
							</p>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
								{customizations.additionalIngredients.map(
									({ ingredient, amount }) => (
										<div key={ingredient.id} className="card bg-base-200">
											<div className="card-body p-4">
												<h4 className="font-bold">{ingredient.name}</h4>
												<div className="mt-2">
													<input
														type="number"
														min={0}
														max={100}
														value={amount}
														onChange={(e) =>
															handleAdditionalIngredientAmountChange(
																ingredient.id,
																parseFloat(e.target.value),
															)
														}
														className="input input-bordered w-full"
													/>
													<span className="ml-2">ml</span>
												</div>
											</div>
										</div>
									),
								)}

								{addingIngredient ? (
									<div className="card bg-base-200">
										<div className="card-body p-4">
											<h4 className="font-bold">Add New Ingredient</h4>
											<select
												className="select select-bordered w-full"
												value={selectedIngredient?.id || ""}
												onChange={(e) => {
													const ingredient = availableIngredients.find(
														(ing) => ing.id === e.target.value,
													);
													setSelectedIngredient(ingredient);
												}}
											>
												<option value="">Select ingredient</option>
												{availableIngredients
													.filter(
														(ing) =>
															!customizations.additionalIngredients.some(
																(added) => added.ingredient.id === ing.id,
															),
													)
													.map((ing) => (
														<option key={ing.id} value={ing.id}>
															{ing.name}
														</option>
													))}
											</select>
											<div className="flex gap-2 mt-2">
												<button
													className="btn btn-primary btn-sm"
													onClick={handleAddIngredient}
													disabled={!selectedIngredient}
												>
													Add
												</button>
												<button
													className="btn btn-ghost btn-sm"
													onClick={() => {
														setAddingIngredient(false);
														setSelectedIngredient(null);
													}}
												>
													Cancel
												</button>
											</div>
										</div>
									</div>
								) : (
									<div
										className="card bg-base-200 cursor-pointer hover:bg-base-300"
										onClick={() => setAddingIngredient(true)}
									>
										<div className="card-body items-center text-center">
											<PlusCircle className="mb-2" size={24} />
											<span>Add Ingredient</span>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DrinkCustomizer;
