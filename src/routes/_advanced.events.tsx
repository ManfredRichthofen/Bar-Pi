import { createFileRoute } from '@tanstack/react-router';
import { EventsPage } from '../pages/AdvancedMode/EventsPage/EventsPage';
import { requirePermission } from '../utils/requirePermission';

export const Route = createFileRoute('/_advanced/events')({
  component: EventsPage,
  beforeLoad: () => requirePermission('canManageEvents'),
});
