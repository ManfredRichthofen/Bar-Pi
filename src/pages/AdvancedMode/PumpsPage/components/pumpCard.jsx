// CPumpCard.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	Pencil,
	PlayCircle,
	StopCircle,
	CornerUpLeft,
	CornerUpRight,
	Droplet,
	Hexagon,
	AlertCircle,
} from "lucide-react";
import WebSocketService from "../../../../services/websocket.service";
import PumpService from "../../../../services/pump.service";
import useAuthStore from "../../../../store/authStore";

const showToast = (message, type = "success") => {
	const toastContainer = document.createElement("div");
	toastContainer.className = "toast toast-top toast-end z-50";

	const alert = document.createElement("div");
	alert.className = `alert ${type === "success" ? "alert-success" : "alert-error"}`;

	const content = document.createElement("div");
	content.className = "flex items-center gap-2";

	const icon = document.createElement("span");
	if (type === "success") {
		icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>`;
	} else {
		icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
    </svg>`;
	}

	const text = document.createElement("span");
	text.textContent = message;

	content.appendChild(icon);
	content.appendChild(text);
	alert.appendChild(content);
	toastContainer.appendChild(alert);
	document.body.appendChild(toastContainer);

	setTimeout(() => {
		toastContainer.style.opacity = "1";
		toastContainer.style.transform = "translateY(0)";
	}, 100);

	setTimeout(() => {
		toastContainer.style.opacity = "0";
		toastContainer.style.transform = "translateY(-1rem)";
		setTimeout(() => {
			document.body.removeChild(toastContainer);
		}, 300);
	}, 3000);
};

// TODO create a custom StepperMotorIcon component
const StepperMotorIcon = ({ width = 24, height = 24, className = "" }) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<circle cx="12" cy="12" r="10" />
		<path d="M12 6v12" />
		<path d="M8 10l8 4" />
		<path d="M16 10l-8 4" />
	</svg>
);

// Animated progress bar component for infinite progress
const AnimatedProgressBar = ({ className = "" }) => {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) return 0;
				return prev + 2;
			});
		}, 100);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className={`progress ${className} overflow-hidden`}>
			<div 
				className="progress-bar bg-primary transition-all duration-300 ease-out"
				style={{ 
					width: `${progress}%`,
					transition: 'width 0.1s ease-out'
				}}
			/>
		</div>
	);
};

const PumpCard = ({ pump, showDetailed = false }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const token = useAuthStore((state) => state.token);

	const [pumpDownBtnLoading, setPumpDownBtnLoading] = useState(false);
	const [pumpUpBtnLoading, setPumpUpBtnLoading] = useState(false);
	const [runningBtnLoading, setRunningBtnLoading] = useState(false);
	const [pumpJobState, setPumpJobState] = useState({
		lastJobId: null,
		runningState: null,
	});
	const [lastUpdate, setLastUpdate] = useState(null);

	// Memoized WebSocket topic
	const wsTopic = useMemo(() => `/user/topic/pump/runningstate/${pump.id}`, [pump.id]);

	// WebSocket subscription
	useEffect(() => {
		const handleWebSocketMessage = (data) => {
			try {
				const parsed = JSON.parse(data.body);
				setPumpJobState(parsed);
				setLastUpdate(new Date());
			} catch (err) {
				console.error("Error parsing pump job state", err);
			}
		};

		// Subscribe to WebSocket
		WebSocketService.subscribe(
			`pump-${pump.id}`, // Use unique component identifier
			wsTopic,
			handleWebSocketMessage,
			true,
		);

		return () => {
			WebSocketService.unsubscribe(`pump-${pump.id}`, wsTopic);
		};
	}, [pump.id, wsTopic]);

	// Memoized display attributes
	const displayAttributes = useMemo(() => {
		const getDisplayAttribute = (attr, suffix = "") => {
			const missingText = "Missing";
			if ((attr === undefined || attr === null) && attr !== 0) {
				return { className: "text-red-500", label: missingText };
			} else {
				return {
					className: "text-inherit",
					label: `${attr}${suffix ? " " + suffix : ""}`,
				};
			}
		};

		const getDisplayPin = (pin) => {
			const missingText = "Missing";
			if (!pin) {
				return { className: "text-red-500", label: missingText };
			} else {
				return {
					className: "text-inherit",
					label: `${pin.boardName} / ${pin.pinName}`,
				};
			}
		};

		return {
			fillingLevel: getDisplayAttribute(pump.fillingLevelInMl, "ml"),
			pin: getDisplayPin(pump.pin),
		};
	}, [pump.fillingLevelInMl, pump.pin]);

	// Memoized display name
	const displayName = useMemo(() => 
		pump.name || t("pump_card.unnamed", { id: pump.id }), 
		[pump.name, pump.id, t]
	);

	// Memoized pump type information
	const pumpTypeInfo = useMemo(() => {
		const printPumpType = (() => {
			switch (pump.type) {
				case "dc":
					return t("pump_card.type_dc");
				case "stepper":
					return t("pump_card.type_stepper");
				case "valve":
					return t("pump_card.type_valve");
				default:
					return "";
			}
		})();

		const PumpTypeIcon = (() => {
			if (pump.type === "dc") {
				return <Droplet size={16} className="inline-block mr-1" />;
			} else if (pump.type === "stepper") {
				return (
					<StepperMotorIcon
						width={16}
						height={16}
						className="inline-block mr-1"
					/>
				);
			} else {
				return <Hexagon size={16} className="inline-block mr-1" />;
			}
		})();

		return { printPumpType, PumpTypeIcon };
	}, [pump.type, t]);

	// Memoized progress bar data
	const progressBar = useMemo(() => {
		const abortVal = {
			value: pump.pumpedUp ? 1 : 0,
			query: false,
			reverse: false,
		};
		if (!pumpJobState.runningState) {
			return abortVal;
		}
		const runningState = pumpJobState.runningState;
		let value = runningState.forward
			? runningState.percentage
			: 100 - runningState.percentage;
		value = value / 100;
		return {
			value,
			query: runningState.runInfinity,
			reverse: runningState.forward && runningState.runInfinity,
		};
	}, [pumpJobState.runningState, pump.pumpedUp]);

	// Memoized ingredient display
	const printIngredient = useMemo(() => 
		pump.currentIngredient
			? pump.currentIngredient.name
			: t("pump_card.no_ingredient"),
		[pump.currentIngredient, t]
	);

	// Memoized state information
	const stateInfo = useMemo(() => {
		const pumpedUpState = (() => {
			if (pump.pumpedUp) {
				return { color: "badge-success", label: t("pump_card.state_pumped_up") };
			} else {
				return { color: "badge-error", label: t("pump_card.state_pumped_down") };
			}
		})();

		const pumpState = (() => {
			let state = { color: "", label: "" };
			if (pumpJobState.runningState) {
				state = { color: "badge-success", label: t("pump_card.state_running") };
			} else {
				switch (pump.state) {
					case "READY":
						state = { color: "badge-success", label: t("pump_card.state_ready") };
						break;
					case "INCOMPLETE":
					case "TESTABLE":
						state = {
							color: "badge-error",
							label: t("pump_card.state_incomplete"),
						};
						break;
					default:
						state = { color: "", label: pump.state };
				}
			}
			return state;
		})();

		return { pumpedUpState, pumpState };
	}, [pump.pumpedUp, pumpJobState.runningState, pump.state, t]);

	// Memoized action handlers
	const onClickTurnOnOrOffPump = useCallback(() => {
		setRunningBtnLoading(true);
		if (pumpJobState.runningState) {
			PumpService.stopPump(pump.id, token)
				.then(() => {
					showToast(`Pump "${displayName}" stopped successfully`);
				})
				.catch((error) => {
					console.error("Failed to stop pump:", error);
					showToast(`Failed to stop pump "${displayName}"`, "error");
				})
				.finally(() => setRunningBtnLoading(false));
		} else {
			PumpService.startPump(pump.id, token)
				.then(() => {
					showToast(`Pump "${displayName}" started successfully`);
				})
				.catch((error) => {
					console.error("Failed to start pump:", error);
					showToast(`Failed to start pump "${displayName}"`, "error");
				})
				.finally(() => setRunningBtnLoading(false));
		}
	}, [pumpJobState.runningState, pump.id, token, displayName]);

	const onClickPumpUp = useCallback((reverse) => {
		if (reverse) {
			setPumpDownBtnLoading(true);
			PumpService.pumpDown(pump.id, token)
				.catch((error) => {
					console.error("Failed to pump down:", error);
					showToast(`Failed to pump down "${displayName}"`, "error");
				})
				.finally(() => setPumpDownBtnLoading(false));
		} else {
			setPumpUpBtnLoading(true);
			PumpService.pumpUp(pump.id, token)
				.catch((error) => {
					console.error("Failed to pump up:", error);
					showToast(`Failed to pump up "${displayName}"`, "error");
				})
				.finally(() => setPumpUpBtnLoading(false));
		}
	}, [pump.id, token, displayName]);

	// --- Render ---
	return (
		<div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
			{/* Header */}
			<div className="card-body p-3 sm:p-4 bg-base-200 rounded-t-2xl flex-shrink-0">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<h3 className="card-title text-base sm:text-lg truncate">{displayName}</h3>
						<p className="text-xs sm:text-sm text-base-content/70 flex items-center">
							{pumpTypeInfo.PumpTypeIcon}
							{pumpTypeInfo.printPumpType}
						</p>
						{lastUpdate && (
							<div className="text-xs text-base-content/50 mt-1">
								Last update: {lastUpdate.toLocaleTimeString()}
							</div>
						)}
					</div>
					<div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
						<button
							onClick={() => navigate({ to: `/pumps/${pump.id}/edit` })}
							className="btn btn-ghost btn-sm px-2"
							title={t("common.edit")}
						>
							<Pencil className="h-4 w-4" />
						</button>
						<div className="flex flex-col gap-1">
							<span className={`badge ${stateInfo.pumpedUpState.color} badge-sm whitespace-nowrap text-xs`}>
								{stateInfo.pumpedUpState.label}
							</span>
							<span className={`badge ${stateInfo.pumpState.color} badge-sm whitespace-nowrap text-xs`}>
								{stateInfo.pumpState.label}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Improved Progress Bar */}
			<div className="flex-shrink-0">
				{pumpJobState.runningState ? (
					<div className="relative w-full">
						<progress className="progress progress-primary w-full" value={30} max="100"></progress>
						<div
							className="absolute left-0 top-0 h-full pointer-events-none"
							style={{ width: "30%", overflow: "hidden" }}
						>
							<div
								className="h-full w-[200%]"
								style={{
									backgroundImage:
										"repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 10px, transparent 10px, transparent 20px)",
									animation: "progressScroll 1s linear infinite",
								}}
							/>
						</div>
						<style>{`@keyframes progressScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
					</div>
				) : (
					<progress
						className="progress progress-primary w-full"
						value={progressBar.value * 100}
						max="100"
					></progress>
				)}
			</div>

			<div className="card-body p-3 sm:p-4 flex-1 flex flex-col">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm flex-shrink-0">
					<div className="text-base-content/70 flex justify-between sm:block">
						<span className="sm:hidden">{t("pump_card.ingredient")}</span>
						<span className="hidden sm:block">{t("pump_card.ingredient")}</span>
						<span className="sm:hidden font-medium truncate">{printIngredient}</span>
					</div>
					<div className="hidden sm:block text-right font-medium truncate">{printIngredient}</div>
					<div className="text-base-content/70 flex justify-between sm:block">
						<span className="sm:hidden">{t("pump_card.filling_level")}</span>
						<span className="hidden sm:block">{t("pump_card.filling_level")}</span>
						<span className={`sm:hidden font-medium ${displayAttributes.fillingLevel.className}`}>
							{displayAttributes.fillingLevel.label}
						</span>
					</div>
					<div className={`hidden sm:block text-right font-medium ${displayAttributes.fillingLevel.className}`}>
						{displayAttributes.fillingLevel.label}
					</div>
				</div>

				{showDetailed && (
					<>
						<div className="divider my-2 flex-shrink-0"></div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm flex-shrink-0"></div>
					</>
				)}

				<div className="card-actions justify-end mt-auto pt-3 sm:pt-4 flex-shrink-0">
					<div className="join">
						{pump.canControlDirection && (
							<>
								<button
									onClick={() => onClickPumpUp(true)}
									disabled={!!pumpJobState.runningState}
									className={`btn btn-sm join-item ${pumpDownBtnLoading ? "loading" : ""}`}
									title={t("pump_card.pump_down")}
								>
									<CornerUpLeft className="h-3 w-3 sm:h-4 sm:w-4" />
								</button>
								<button
									onClick={() => onClickPumpUp(false)}
									disabled={!!pumpJobState.runningState}
									className={`btn btn-sm join-item ${pumpUpBtnLoading ? "loading" : ""}`}
									title={t("pump_card.pump_up")}
								>
									<CornerUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
								</button>
							</>
						)}
						<button
							onClick={onClickTurnOnOrOffPump}
							disabled={runningBtnLoading}
							className={`btn btn-sm join-item ${runningBtnLoading ? "loading" : ""}`}
							title={
								pumpJobState.runningState
									? t("pump_card.stop")
									: t("pump_card.start")
							}
						>
							{pumpJobState.runningState ? (
								<StopCircle className="h-3 w-3 sm:h-4 sm:w-4" />
							) : (
								<PlayCircle className="h-3 w-3 sm:h-4 sm:w-4" />
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PumpCard;
