import { createFileRoute } from '@tanstack/react-router';
import Settings from '../pages/AdvancedMode/SettingsPage/settings';

export const Route = createFileRoute('/_advanced/settings')({
  component: AdvancedSettingsRoute,
});

function AdvancedSettingsRoute() {
  return <Settings />;
}
