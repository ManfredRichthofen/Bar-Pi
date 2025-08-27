import React, { useState, useEffect, useCallback } from "react";
import useAuthStore from "../../../store/authStore";
import { usePumpStore } from "../../../store/pumpStore";
import PumpService from "../../../services/pump.service";
import PumpStatus from "./components/pumpStatus.jsx";
import PumpCard from "./components/pumpCard.jsx";
import PumpSetupTypeSelector from "./components/pumpSelector";
import { PlusCircle, PlayCircle, StopCircle, AlertCircle } from "lucide-react";

const Pumps = () => {
	const [showAddDialog, setShowAddDialog] = useState(false);
	const token = useAuthStore((state) => state.token);

	const { pumps, isAllowReversePumping, loading, error, fetchPumps } =
		usePumpStore();

	useEffect(() => {
		if (token) {
			fetchPumps(token);
		}
	}, [token]);

	const showToast = (message, type = "error") => {
		const toastContainer = document.createElement("div");
		toastContainer.className = "toast toast-bottom toast-end z-50";

		const alert = document.createElement("div");
		alert.className = `alert ${type === "success" ? "alert-success" : "alert-error"} shadow-lg`;

		const content = document.createElement("div");
		content.className = "flex items-center gap-2";

		// Add icon based on type
		const icon = document.createElement("span");
		if (type === "success") {
			icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>`;
		} else {
			icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>`;
		}

		const text = document.createElement("span");
		text.textContent = message;
		text.className = "font-medium break-words";

		content.appendChild(icon);
		content.appendChild(text);
		alert.appendChild(content);
		toastContainer.appendChild(alert);
		document.body.appendChild(toastContainer);

		// Add entrance animation
		toastContainer.style.opacity = "0";
		toastContainer.style.transform = "translateY(-1rem)";
		toastContainer.style.transition = "all 0.3s ease-in-out";

		setTimeout(() => {
			toastContainer.style.opacity = "1";
			toastContainer.style.transform = "translateY(0)";
		}, 100);

		// Auto remove after 3 seconds
		setTimeout(() => {
			toastContainer.style.opacity = "0";
			toastContainer.style.transform = "translateY(-1rem)";
			setTimeout(() => {
				if (document.body.contains(toastContainer)) {
					document.body.removeChild(toastContainer);
				}
			}, 300);
		}, 3000);
	};

	const onClickTurnOnAllPumps = () => {
		PumpService.startPump(null, token)
			.then(() => {
				showToast("All pumps started successfully", "success");
			})
			.catch((err) => {
				showToast("Failed to start pumps");
				console.error(err);
			});
	};

	const onClickTurnOffAllPumps = () => {
		PumpService.stopPump(null, token)
			.then(() => {
				showToast("All pumps stopped successfully", "success");
			})
			.catch((err) => {
				showToast("Failed to stop pumps");
				console.error(err);
			});
	};

	return (
		<div className="min-h-screen bg-base-100">
			{/* Loading Overlay */}
			{loading && (
				<div className="fixed inset-0 bg-base-100/50 backdrop-blur-sm flex justify-center items-center z-50">
					<div className="loading loading-spinner loading-lg text-primary"></div>
				</div>
			)}

			{/* Error Alert */}
			{error && (
				<div className="alert alert-error mb-4 mx-4 mt-4 shadow-lg">
					<AlertCircle className="h-6 w-6 shrink-0" />
					<span className="font-medium break-words">{error}</span>
				</div>
			)}

			{/* Header Section */}
			<div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
				<div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<h1 className="text-xl sm:text-2xl font-bold text-base-content break-words">
						Pump Management
					</h1>
					<div className="join shadow-lg flex-shrink-0 w-full sm:w-auto">
						<button
							type="button"
							className="btn btn-primary join-item shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none"
							onClick={() => setShowAddDialog(true)}
						>
							<PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 shrink-0" />
							<span className="break-words text-xs sm:text-sm">Add Pump</span>
						</button>
						<button
							type="button"
							className="btn btn-success join-item shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none"
							onClick={onClickTurnOnAllPumps}
						>
							<PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 shrink-0" />
							<span className="break-words text-xs sm:text-sm">Start All</span>
						</button>
						<button
							type="button"
							className="btn btn-error join-item shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none"
							onClick={onClickTurnOffAllPumps}
						>
							<StopCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 shrink-0" />
							<span className="break-words text-xs sm:text-sm">Stop All</span>
						</button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="p-4 sm:p-6">
				{/* Mobile Layout - Stacked */}
				<div className="block lg:hidden space-y-6">
					{/* Pump Status - Full width on mobile */}
					<div className="w-full">
						<PumpStatus />
					</div>
					
					{/* Pump Cards Grid - Responsive columns */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
						{pumps && pumps.length > 0 ? (
							pumps.map((pump) => (
								<div key={pump.id} className="w-full">
									<PumpCard pump={pump} showDetailed />
								</div>
							))
						) : (
							<div className="col-span-full">
								<div className="card bg-base-200 shadow-lg border border-base-300">
									<div className="card-body p-6 sm:p-8 flex flex-col items-center justify-center text-center">
										<AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-base-content/50 mb-4 shrink-0" />
										<h3 className="text-base sm:text-lg font-semibold text-base-content mb-2 break-words">
											No Pumps Found
										</h3>
										<p className="text-base-content/70 mb-4 break-words text-sm sm:text-base">
											Get started by adding your first pump
										</p>
										<button
											className="btn btn-primary shadow-md hover:shadow-lg transition-all duration-200"
											onClick={() => setShowAddDialog(true)}
										>
											<PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 shrink-0" />
											<span className="break-words">Add First Pump</span>
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Desktop Layout - Sidebar + Main */}
				<div className="hidden lg:grid lg:grid-cols-12 gap-6">
					{/* Pump Status Sidebar */}
					<div className="lg:col-span-3 xl:col-span-2">
						<div className="card bg-base-200 shadow-lg border border-base-300 sticky top-24">
							<div className="card-body p-4 xl:p-6 overflow-hidden">
								<PumpStatus />
							</div>
						</div>
					</div>
					
					{/* Pump Cards Grid */}
					<div className="lg:col-span-9 xl:col-span-10">
						<div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 xl:gap-6">
							{pumps && pumps.length > 0 ? (
								pumps.map((pump) => (
									<div key={pump.id} className="w-full">
										<PumpCard pump={pump} showDetailed />
									</div>
								))
							) : (
								<div className="col-span-full">
									<div className="card bg-base-200 shadow-lg border border-base-300">
										<div className="card-body p-8 flex flex-col items-center justify-center text-center">
											<AlertCircle className="h-12 w-12 text-base-content/50 mb-4 shrink-0" />
											<h3 className="text-lg font-semibold text-base-content mb-2 break-words">
												No Pumps Found
											</h3>
											<p className="text-base-content/70 mb-4 break-words">
												Get started by adding your first pump
											</p>
											<button
												className="btn btn-primary shadow-md hover:shadow-lg transition-all duration-200"
												onClick={() => setShowAddDialog(true)}
											>
												<PlusCircle className="h-5 w-5 mr-2 shrink-0" />
												<span className="break-words">Add First Pump</span>
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			{/* Add Pump Dialog */}
			{showAddDialog && (
				<PumpSetupTypeSelector
					show={showAddDialog}
					onClose={() => setShowAddDialog(false)}
				/>
			)}
		</div>
	);
};

export default Pumps;
