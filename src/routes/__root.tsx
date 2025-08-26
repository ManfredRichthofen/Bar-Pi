import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore";
import useUIModeStore from "../store/uiModeStore";
import { themeChange } from "theme-change";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Initialize the query client
const queryClient = new QueryClient();

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const reinitializeAuthState = useAuthStore(
		(state) => state.reinitializeAuthState,
	);
	const { i18n } = useTranslation();
	const [isAuthInitialized, setIsAuthInitialized] = useState(false);
	const { isInitialized: isUIModeInitialized } = useUIModeStore();

	// Auth initialization
	useEffect(() => {
		const initialize = async () => {
			await reinitializeAuthState();
			setIsAuthInitialized(true);
		};
		initialize();
	}, [reinitializeAuthState]);

	// Theme and language initialization
	useEffect(() => {
		// Theme initialization
		const savedTheme = localStorage.getItem("theme") || "light";
		document.documentElement.setAttribute("data-theme", savedTheme);
		themeChange(false);

		// Language initialization
		const savedLanguage = localStorage.getItem("i18nextLng") || "en-US";
		i18n.changeLanguage(savedLanguage);

		// Theme observer
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === "data-theme") {
					const newTheme = document.documentElement.getAttribute("data-theme");
					if (newTheme) {
						localStorage.setItem("theme", newTheme);
					}
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
		});

		return () => observer.disconnect();
	}, [i18n]);

	// Show nothing while initializing to prevent flash of incorrect content
	if (!isAuthInitialized || !isUIModeInitialized) {
		return null;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
