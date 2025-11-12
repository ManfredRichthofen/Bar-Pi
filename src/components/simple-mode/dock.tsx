import type React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "@tanstack/react-router";
import { Clock, Settings, GlassWater } from "lucide-react";

const Dock: React.FC = () => {
	const { t } = useTranslation();
	const location = useLocation();

	const isActive = (path: string) => {
		return location.pathname.startsWith(path);
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-base-100/95 backdrop-blur-md border-t border-base-300 z-50 shadow-lg sm:shadow-xl">
			<div className="flex justify-around items-center h-16 sm:h-20 md:h-24 px-2 sm:px-4 md:px-6 max-w-md sm:max-w-2xl md:max-w-4xl mx-auto">
				<Link
					to="/simple/drinks"
					className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 md:gap-2 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl transition-all duration-200 min-w-[3.5rem] sm:min-w-[4rem] md:min-w-[5rem] ${
						isActive("/simple/drinks")
							? "bg-primary text-primary-content shadow-md sm:shadow-lg scale-105 sm:scale-110"
							: "text-base-content/70 hover:text-base-content hover:bg-base-200 active:scale-95"
					}`}
				>
					<GlassWater className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
					<span className="text-[10px] sm:text-xs md:text-sm font-medium">
						{t("navigation.drinks")}
					</span>
				</Link>

				<Link
					to="/simple/order-status"
					className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 md:gap-2 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl transition-all duration-200 min-w-[3.5rem] sm:min-w-[4rem] md:min-w-[5rem] ${
						isActive("/simple/order-status")
							? "bg-primary text-primary-content shadow-md sm:shadow-lg scale-105 sm:scale-110"
							: "text-base-content/70 hover:text-base-content hover:bg-base-200 active:scale-95"
					}`}
				>
					<Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
					<span className="text-[10px] sm:text-xs md:text-sm font-medium">
						{t("navigation.order_status")}
					</span>
				</Link>

				<Link
					to="/simple/settings"
					className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 md:gap-2 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl transition-all duration-200 min-w-[3.5rem] sm:min-w-[4rem] md:min-w-[5rem] ${
						isActive("/simple/settings")
							? "bg-primary text-primary-content shadow-md sm:shadow-lg scale-105 sm:scale-110"
							: "text-base-content/70 hover:text-base-content hover:bg-base-200 active:scale-95"
					}`}
				>
					<Settings className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
					<span className="text-[10px] sm:text-xs md:text-sm font-medium">
						{t("navigation.settings")}
					</span>
				</Link>
			</div>
		</div>
	);
};

export default Dock;
