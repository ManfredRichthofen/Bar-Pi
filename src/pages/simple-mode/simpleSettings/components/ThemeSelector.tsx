import { Palette } from "lucide-react";
import { useEffect } from "react";

interface ThemeSelectorProps {
	themes: string[];
}

const ThemeSelector = ({ themes }: ThemeSelectorProps) => {
	useEffect(() => {
		const currentTheme = localStorage.getItem("theme") || "light";
		const themeSelect = document.querySelector(
			"[data-choose-theme]",
		) as HTMLSelectElement;
		if (themeSelect) {
			themeSelect.value = currentTheme;
		}
	}, []);

	const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const theme = e.target.value;
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("theme", theme);
	};

	return (
		<div className="card bg-base-200/50 shadow-sm sm:shadow-lg border border-base-300">
			<div className="card-body p-4 sm:p-6">
				<h2 className="card-title text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2 text-base-content">
					<Palette className="w-4 h-4 sm:w-5 sm:h-5" />
					Appearance
				</h2>

				<fieldset className="fieldset border-base-300">
					<legend className="fieldset-legend text-base-content font-medium flex items-center gap-2 text-sm sm:text-base">
						<Palette className="w-3 h-3 sm:w-4 sm:h-4" />
						Theme
					</legend>
					<select
						className="select select-bordered w-full h-10 sm:h-12 text-sm sm:text-base border-base-300 focus:border-primary"
						data-choose-theme
						defaultValue="light"
						onChange={handleThemeChange}
					>
						{themes.map((theme) => (
							<option key={theme} value={theme}>
								{theme.charAt(0).toUpperCase() + theme.slice(1)}
							</option>
						))}
					</select>
				</fieldset>
			</div>
		</div>
	);
};

export default ThemeSelector;
