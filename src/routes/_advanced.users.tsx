import { createFileRoute } from '@tanstack/react-router';
import CreateUser from '../pages/AdvancedMode/UsersPage/user';
import { requirePermission } from '../utils/requirePermission';

export const Route = createFileRoute('/_advanced/users')({
  component: AdvancedUsersRoute,
  beforeLoad: () => requirePermission('canManageUsers'),
});

function AdvancedUsersRoute() {
  return <CreateUser />;
}
