import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '../pages/AdvancedMode/SettingsPage/SettingsPage';

export const Route = createFileRoute('/_advanced/settings')({
  component: AdvancedSettingsRoute,
});

function AdvancedSettingsRoute() {
  return <SettingsPage />;
}
