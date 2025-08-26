import { createFileRoute } from '@tanstack/react-router';
import Categories from '../pages/categories';

export const Route = createFileRoute('/_advanced/categories')({
  component: Categories,
});
