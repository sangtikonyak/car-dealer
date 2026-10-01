import { SiteLayout } from './SiteLayout';
import { HomePage } from '../pages/HomePage';
import { InventoryPage } from '../features/inventory/pages/InventoryPage';
import { VehicleDetailsPage } from '../features/inventory/pages/VehicleDetailsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LegalPage } from '../pages/LegalPage';
import { AdminLoginPage } from '../features/admin/pages/AdminLoginPage';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';

export const routeObjects = [
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/:vehicleSlug', element: <VehicleDetailsPage /> },
      { path: 'terms', element: <LegalPage kind="terms" /> },
      { path: 'privacy', element: <LegalPage kind="privacy" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/admin/login', element: <AdminLoginPage /> },
  { path: '/admin/*', element: <AdminDashboardPage /> },
];
