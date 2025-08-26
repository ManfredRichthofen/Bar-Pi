import { createFileRoute } from "@tanstack/react-router";
import SimpleDrinkDetail from "../pages/simple-mode/simpleDrinkDetail";

export const Route = createFileRoute("/simple/drink/$id")({
	component: SimpleDrinkDetailRoute,
});

function SimpleDrinkDetailRoute() {
	return <SimpleDrinkDetail />;
}
