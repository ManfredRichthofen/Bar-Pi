import { createFileRoute, Navigate } from "@tanstack/react-router";
import useAuthStore from "../store/authStore";
import useUIModeStore from "../store/uiModeStore";
import Login from "../pages/login";

export const Route = createFileRoute("/login")({
	component: LoginRoute,
});

function LoginRoute() {
	const token = useAuthStore((state) => state.token);
	const { isAdvancedMode } = useUIModeStore();

	// If user is already authenticated, redirect to appropriate page
	if (token) {
		return (
			<Navigate to={isAdvancedMode ? "/drinks" : "/simple/drinks"} replace />
		);
	}

	return <Login />;
}
