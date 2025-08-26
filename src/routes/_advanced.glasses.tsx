import { createFileRoute } from '@tanstack/react-router';
import Glasses from '../pages/glasses';

export const Route = createFileRoute('/_advanced/glasses')({
  component: AdvancedGlassesRoute,
});

function AdvancedGlassesRoute() {
  return <Glasses />;
}
