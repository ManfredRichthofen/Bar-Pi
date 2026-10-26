import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '../pages/AdvancedMode/SettingsPage/SettingsPage';
import { requirePermission } from '../utils/requirePermission';

export const Route = createFileRoute('/_advanced/settings')({
  component: AdvancedSettingsRoute,
  beforeLoad: () => requirePermission('canManageSettings'),
});

function AdvancedSettingsRoute() {
  return <SettingsPage />;
}
