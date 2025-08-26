import React from "react";

const FilterButtons = React.memo(({ filters, onFilterChange }) => (
	<div className="flex flex-col gap-3">
		<div className="flex flex-wrap gap-2">
			<button
				className={`btn btn-sm h-10 ${filters.automatic ? "btn-primary" : "btn-outline"} transition-colors`}
				onClick={() => onFilterChange("automatic")}
				title="Show drinks with all automated ingredients"
			>
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full bg-primary"></span>
					Automatic
				</span>
			</button>
			<button
				className={`btn btn-sm h-10 ${filters.manual ? "btn-primary" : "btn-outline"} transition-colors`}
				onClick={() => onFilterChange("manual")}
				title="Show drinks that require manual preparation"
			>
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full bg-primary"></span>
					Manual
				</span>
			</button>
			<button
				className={`btn btn-sm h-10 ${filters.available ? "btn-primary" : "btn-outline"} transition-colors`}
				onClick={() => onFilterChange("available")}
				title="Show drinks with ingredients on pumps or in the bar"
			>
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full bg-primary"></span>
					Available
				</span>
			</button>
		</div>
		{(filters.automatic || filters.manual || filters.available) && (
			<button
				className="btn btn-ghost btn-sm h-10 text-error hover:bg-error/10 transition-colors"
				onClick={() => onFilterChange("clear")}
			>
				Clear Filters
			</button>
		)}
	</div>
));

export default FilterButtons;
