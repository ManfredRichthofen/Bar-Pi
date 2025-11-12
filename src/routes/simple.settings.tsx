import { createFileRoute } from '@tanstack/react-router';
import SimpleSettings from '../pages/simple-mode/simpleSettings/simpleSettings';

export const Route = createFileRoute('/simple/settings')({
  component: SimpleSettingsRoute,
});

function SimpleSettingsRoute() {
  return <SimpleSettings />;
}
