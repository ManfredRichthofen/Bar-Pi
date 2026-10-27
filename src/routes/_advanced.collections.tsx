import { createFileRoute } from '@tanstack/react-router';
import { CollectionsPage } from '../pages/AdvancedMode/CollectionsPage/CollectionsPage';

export const Route = createFileRoute('/_advanced/collections')({
  component: CollectionsPage,
});
