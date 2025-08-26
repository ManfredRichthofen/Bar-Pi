import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import useAuthStore from "../store/authStore";
import useUIModeStore from "../store/uiModeStore";
import MainLayout from "../components/Layout";

export const Route = createFileRoute("/_advanced")({
	component: AdvancedModeLayout,
	beforeLoad: () => {
		// Check authentication
		const token = useAuthStore.getState().token;
		if (!token) {
			throw redirect({ to: "/login" });
		}

		// Check if user is in simple mode
		const { isAdvancedMode } = useUIModeStore.getState();
		if (!isAdvancedMode) {
			throw redirect({ to: "/simple/drinks" });
		}
	},
});

function AdvancedModeLayout() {
	return (
		<MainLayout>
			<Outlet />
		</MainLayout>
	);
}
