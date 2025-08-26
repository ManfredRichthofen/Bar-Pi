import { createFileRoute } from "@tanstack/react-router";
import Order from "../pages/order";

export const Route = createFileRoute("/_advanced/order")({
	component: AdvancedOrderRoute,
});

function AdvancedOrderRoute() {
	return <Order />;
}
