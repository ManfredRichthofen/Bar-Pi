import { createFileRoute } from "@tanstack/react-router";
import EditPumpPage from "../pages/AdvancedMode/PumpsPage/EditPumpPage";

export const Route = createFileRoute("/_advanced/pumps/$pumpId/edit")({
	component: EditPumpRoute,
});

function EditPumpRoute() {
	return <EditPumpPage />;
}
