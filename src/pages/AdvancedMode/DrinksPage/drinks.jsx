import React, { useState, useCallback } from "react";
import useAuthStore from "../../../store/authStore.js";
import { Navigate } from "@tanstack/react-router";
import VirtualDrinksGrid from "../../../components/drinks/VirtualDrinksGrid.jsx";
import { Search } from "lucide-react";
import debounce from "lodash/debounce";

const Drinks = ({ sidebarCollapsed = false }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [searchValue, setSearchValue] = useState("");
	const [searchLoading, setSearchLoading] = useState(false);

	const token = useAuthStore((state) => state.token);

	const debouncedSearch = useCallback(
		debounce((value) => {
			setSearchTerm(value);
			setSearchLoading(false);
		}, 500),
		[],
	);

	const handleSearch = (e) => {
		e.preventDefault();
		const value = e.target.search.value;
		setSearchValue(value);
		setSearchLoading(true);
		debouncedSearch(value);
	};

	const handleSearchInput = (e) => {
		const value = e.target.value;
		setSearchValue(value);
		setSearchLoading(true);
		debouncedSearch(value);
	};

	if (!token) {
		return <Navigate to="/login" />;
	}

	return (
		<div className="min-h-screen bg-base-100">
			{/* Header */}
			<div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
				<div className="p-4 space-y-4">
					<div className="flex items-center justify-between">
						<h1 className="text-xl font-bold">Available Drinks</h1>
					</div>

					<form onSubmit={handleSearch} className="max-w-md mx-auto">
						<div className="join w-full">
							<input
								name="search"
								value={searchValue}
								onChange={handleSearchInput}
								className="input join-item w-full"
								placeholder="Search drinks..."
							/>
							<button type="submit" className="btn bg-base-100 join-item">
								<Search className="h-5 w-5" />
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* Main Content */}
			<VirtualDrinksGrid
				token={token}
				searchTerm={searchTerm}
				collapsed={sidebarCollapsed}
			/>
		</div>
	);
};

export default Drinks;
