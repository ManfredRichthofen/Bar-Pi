import { createFileRoute } from "@tanstack/react-router";
import Pumps from "../pages/pumps";

export const Route = createFileRoute("/_advanced/pumps")({
	component: AdvancedPumpsRoute,
});

function AdvancedPumpsRoute() {
	return <Pumps />;
}
