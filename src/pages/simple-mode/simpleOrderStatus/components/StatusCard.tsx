import { Check, AlertTriangle, Timer, Square } from "lucide-react";

interface StatusCardProps {
	recipeName: string;
	state: string;
	progress: number;
	onCancel: () => void;
	canceling: boolean;
}

const StatusCard = ({ recipeName, state, progress, onCancel, canceling }: StatusCardProps) => {
	const getStatusIcon = () => {
		switch (state) {
			case "FINISHED":
				return <Check size={20} className="sm:w-6 sm:h-6" />;
			case "CANCELLED":
				return <Square size={20} className="sm:w-6 sm:h-6" />;
			case "MANUAL_ACTION_REQUIRED":
			case "MANUAL_INGREDIENT_ADD":
				return <AlertTriangle size={20} className="sm:w-6 sm:h-6" />;
			default:
				return <Timer size={20} className="sm:w-6 sm:h-6" />;
		}
	};

	const getStatusClass = () => {
		switch (state) {
			case "FINISHED":
				return "text-success";
			case "CANCELLED":
				return "text-error";
			case "MANUAL_ACTION_REQUIRED":
			case "MANUAL_INGREDIENT_ADD":
				return "text-warning";
			default:
				return "text-success";
		}
	};

	return (
		<div className="card bg-base-200/50 shadow-sm">
			<div className="card-body p-3 sm:p-4">
				<div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
					<div className="min-w-0 flex-1">
						<h2 className="text-base sm:text-lg font-bold truncate mb-1">
							{recipeName}
						</h2>
						<div className="flex items-center gap-2 flex-wrap">
							<div className={getStatusClass()}>{getStatusIcon()}</div>
							<span className="badge badge-sm sm:badge-md capitalize text-xs sm:text-sm">
								{state.toLowerCase().replace(/_/g, " ")}
							</span>
						</div>
					</div>
					<button
						type="button"
						className="btn btn-circle btn-error btn-sm sm:btn-md shrink-0"
						onClick={onCancel}
						disabled={
							canceling ||
							["CANCELLED", "FINISHED"].includes(state)
						}
					>
						<Square size={16} className="sm:w-5 sm:h-5" />
					</button>
				</div>

				{/* Progress Bar */}
				<div className="space-y-1.5 sm:space-y-2">
					<div className="flex justify-between text-xs sm:text-sm">
						<span className="text-base-content/70">Progress</span>
						<span className="font-semibold">{progress}%</span>
					</div>
					<progress
						className={`progress progress-${getStatusClass().replace("text-", "")} w-full h-2 sm:h-3`}
						value={progress}
						max="100"
					/>
				</div>
			</div>
		</div>
	);
};

export default StatusCard;
