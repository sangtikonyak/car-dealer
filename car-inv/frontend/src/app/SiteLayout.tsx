import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { DocumentMetadata } from './DocumentMetadata';
import { RouteScrollReset } from './RouteScrollReset';

export function SiteLayout() {
  const location = useLocation();
  const isVehicleDetailRoute = /^\/inventory\/[^/]+$/.test(location.pathname);

  return (
    <div className="site-stage">
      <DocumentMetadata />
      <RouteScrollReset />
      <div className={`site-shell${isVehicleDetailRoute ? ' vehicle-detail-shell' : ''}`}>
        {isVehicleDetailRoute ? null : <Header />}
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}
