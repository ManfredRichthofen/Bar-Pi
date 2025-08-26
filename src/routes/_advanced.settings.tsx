import { createFileRoute } from "@tanstack/react-router";
import Settings from "../pages/settings";

export const Route = createFileRoute("/_advanced/settings")({
	component: AdvancedSettingsRoute,
});

function AdvancedSettingsRoute() {
	return <Settings />;
}
