import { createFileRoute } from "@tanstack/react-router";
import CreateUser from "../pages/AdvancedMode/UsersPage/user";

export const Route = createFileRoute("/_advanced/users")({
	component: AdvancedUsersRoute,
});

function AdvancedUsersRoute() {
	return <CreateUser />;
}
