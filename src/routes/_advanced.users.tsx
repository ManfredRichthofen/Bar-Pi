import { createFileRoute } from '@tanstack/react-router';
import CreateUser from '../pages/user';

export const Route = createFileRoute('/_advanced/users')({
  component: AdvancedUsersRoute,
});

function AdvancedUsersRoute() {
  return <CreateUser />;
}
