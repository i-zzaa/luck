import { useAuth } from '../contexts/auth';
import PublicRoutes from './PublicRoutes';
import OtherRoutes from './OtherRoutes';
import { BrowserRouter } from 'react-router-dom';
import { PermissionProvider } from '../contexts/permission';

function Routes() {
  const { signed } = useAuth();

  return signed ? (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PermissionProvider>
        <OtherRoutes />
      </PermissionProvider>
    </BrowserRouter>
  ) : (
    <PublicRoutes />
  );
}

export default Routes;
