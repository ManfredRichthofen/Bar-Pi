import React, { useState, useEffect } from "react";
import { GlassWater } from "lucide-react";
import glassService from "../../services/glass.service";

const GlassSelector = ({
	selectedGlass,
	customAmount,
	onGlassChange,
	onCustomAmountChange,
	defaultGlass = null,
	token,
}) => {
	const [glasses, setGlasses] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchGlasses = async () => {
			try {
				const response = await glassService.getGlasses(token);
				setGlasses(response);

				if (!selectedGlass && defaultGlass) {
					const defaultGlassFromList = response.find(
						(g) => g.id === defaultGlass.id,
					);
					if (defaultGlassFromList) {
						onGlassChange(defaultGlassFromList);
						onCustomAmountChange(defaultGlassFromList.sizeInMl);
					}
				}
			} catch (error) {
				console.error("Failed to fetch glasses:", error);
			} finally {
				setLoading(false);
			}
		};

		if (token) {
			fetchGlasses();
		}
	}, [token]);

	if (loading) {
		return (
			<div className="flex items-center gap-2">
				<GlassWater size={16} />
				<span className="loading loading-spinner loading-sm"></span>
			</div>
		);
	}

	return (
		<div className="form-control w-full">
			<label className="label">
				<span className="label-text flex items-center gap-2">
					<GlassWater size={16} />
					Glass Size
				</span>
			</label>

			<div className="flex gap-2">
				<select
					className="select select-bordered"
					value={selectedGlass?.id || "custom"}
					onChange={(e) => {
						if (e.target.value === "custom") {
							onGlassChange(null);
						} else {
							const glass = glasses.find((g) => g.id === e.target.value);
							onGlassChange(glass);
							onCustomAmountChange(glass.sizeInMl);
						}
					}}
				>
					<option value="custom">Custom Amount</option>
					{glasses.map((glass) => (
						<option key={glass.id} value={glass.id}>
							{glass.name} {defaultGlass?.id === glass.id ? "(Default)" : ""} -{" "}
							{glass.sizeInMl}ml
						</option>
					))}
				</select>

				{!selectedGlass && (
					<div className="join">
						<input
							type="number"
							min={10}
							max={5000}
							value={customAmount}
							onChange={(e) => onCustomAmountChange(parseFloat(e.target.value))}
							className="input input-bordered join-item w-24"
						/>
						<span className="join-item btn btn-disabled">ml</span>
					</div>
				)}
			</div>

			{selectedGlass && (
				<label className="label">
					<span className="label-text-alt text-base-content/70">
						{selectedGlass.description}
					</span>
				</label>
			)}
		</div>
	);
};

export default GlassSelector;
