import { createFileRoute } from '@tanstack/react-router';
import { StatisticsPage } from '../pages/AdvancedMode/StatisticsPage/StatisticsPage';
import { requirePermission } from '../utils/requirePermission';

export const Route = createFileRoute('/_advanced/statistics')({
  component: AdvancedStatisticsRoute,
  beforeLoad: () => requirePermission('canViewStatistics'),
});

function AdvancedStatisticsRoute() {
  return <StatisticsPage />;
}
