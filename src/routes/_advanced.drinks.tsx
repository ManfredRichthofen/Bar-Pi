import { createFileRoute } from "@tanstack/react-router";
import Drinks from "../pages/AdvancedMode/DrinksPage/drinks";

export const Route = createFileRoute("/_advanced/drinks")({
	component: AdvancedDrinksRoute,
});

function AdvancedDrinksRoute() {
	return <Drinks />;
}
