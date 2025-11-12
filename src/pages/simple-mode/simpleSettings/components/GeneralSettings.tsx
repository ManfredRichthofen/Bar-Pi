import { Globe, Bell, Volume2, LogOut, Settings as SettingsIcon } from "lucide-react";

interface Language {
	code: string;
	name: string;
}

interface GeneralSettingsProps {
	currentLanguage: string;
	languages: Language[];
	onLanguageChange: (langCode: string) => void;
	onAdvancedModeSwitch: () => void;
	onLogout: () => void;
}

const GeneralSettings = ({
	currentLanguage,
	languages,
	onLanguageChange,
	onAdvancedModeSwitch,
	onLogout,
}: GeneralSettingsProps) => {
	return (
		<div className="card bg-base-200/50 shadow-sm sm:shadow-lg border border-base-300">
			<div className="card-body p-4 sm:p-6">
				<h2 className="card-title text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2 text-base-content">
					<SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
					General Settings
				</h2>

				<div className="space-y-4 sm:space-y-5">
					{/* Language Selector */}
					<fieldset className="fieldset border-base-300">
						<legend className="fieldset-legend text-base-content font-medium flex items-center gap-2 text-sm sm:text-base">
							<Globe className="w-3 h-3 sm:w-4 sm:h-4" />
							Language
						</legend>
						<select
							className="select select-bordered w-full h-10 sm:h-12 text-sm sm:text-base border-base-300 focus:border-primary"
							value={currentLanguage}
							onChange={(e) => onLanguageChange(e.target.value)}
						>
							{languages.map((lang) => (
								<option key={lang.code} value={lang.code}>
									{lang.name}
								</option>
							))}
						</select>
					</fieldset>

					<div className="divider my-1 sm:my-2" />

					{/* Toggle Switches */}
					<div className="space-y-3 sm:space-y-4">
						<label className="flex items-center justify-between py-2 sm:py-3 touch-none hover:bg-base-300/50 rounded-lg px-2 transition-colors cursor-pointer">
							<span className="label-text flex-1 mr-3 sm:mr-4 flex items-center gap-2 font-medium text-base-content text-sm sm:text-base">
								<Bell className="w-3 h-3 sm:w-4 sm:h-4" />
								Notifications
							</span>
							<input
								type="checkbox"
								className="toggle toggle-primary toggle-sm sm:toggle-lg"
							/>
						</label>

						<label className="flex items-center justify-between py-2 sm:py-3 touch-none hover:bg-base-300/50 rounded-lg px-2 transition-colors cursor-pointer">
							<span className="label-text flex-1 mr-3 sm:mr-4 flex items-center gap-2 font-medium text-base-content text-sm sm:text-base">
								<Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
								Sound Effects
							</span>
							<input
								type="checkbox"
								className="toggle toggle-primary toggle-sm sm:toggle-lg"
							/>
						</label>

						<div className="divider my-1 sm:my-2" />

						{/* Advanced Mode Switch */}
						<div className="flex items-center justify-between py-2 sm:py-3 hover:bg-base-300/50 rounded-lg px-2 transition-colors">
							<span className="label-text flex-1 mr-3 sm:mr-4 font-medium text-base-content text-sm sm:text-base">
								Switch to Advanced Mode
							</span>
							<button
								type="button"
								className="btn btn-primary h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
								onClick={onAdvancedModeSwitch}
							>
								Switch
							</button>
						</div>

						<div className="divider my-1 sm:my-2" />

						{/* Logout Button */}
						<div className="flex items-center justify-between py-2 sm:py-3 hover:bg-base-300/50 rounded-lg px-2 transition-colors">
							<span className="label-text flex-1 mr-3 sm:mr-4 flex items-center gap-2 font-medium text-base-content text-sm sm:text-base">
								<LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
								Logout
							</span>
							<button
								type="button"
								className="btn btn-error h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
								onClick={onLogout}
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GeneralSettings;
