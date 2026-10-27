import { createFileRoute } from '@tanstack/react-router';
import { GpioManagementPage } from '../pages/AdvancedMode/GpioPage/GpioManagementPage';
import { requirePermission } from '../utils/requirePermission';

export const Route = createFileRoute('/_advanced/gpio')({
  component: AdvancedGpioRoute,
  beforeLoad: () => requirePermission('canManageGpio'),
});

function AdvancedGpioRoute() {
  return <GpioManagementPage />;
}
