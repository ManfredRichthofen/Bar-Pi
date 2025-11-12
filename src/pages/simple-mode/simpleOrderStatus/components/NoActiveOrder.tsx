import { Timer } from "lucide-react";

interface NoActiveOrderProps {
	onOrderDrink: () => void;
}

const NoActiveOrder = ({ onOrderDrink }: NoActiveOrderProps) => {
	return (
		<div className="min-h-screen bg-base-100 flex flex-col">
			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-sm text-center">
					<div className="text-base-content/40 mb-4 sm:mb-6">
						<Timer className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
					</div>
					<h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">No Active Order</h2>
					<p className="text-base-content/70 mb-4 sm:mb-6 text-xs sm:text-sm">
						There is currently no cocktail being prepared
					</p>
					<button
						type="button"
						className="btn btn-primary w-full h-10 sm:h-12 text-sm sm:text-base font-semibold"
						onClick={onOrderDrink}
					>
						Order a Drink
					</button>
				</div>
			</div>
		</div>
	);
};

export default NoActiveOrder;
