import { useAuth } from '../contexts/auth';
import PublicRoutes from './PublicRoutes';
import OtherRoutes from './OtherRoutes';
import { BrowserRouter } from 'react-router-dom';
import { PermissionProvider } from '../contexts/permission';
import { DropdownProvider } from '../contexts/dropDown';
import LayoutProvider from '../contexts/layout.context';

function Routes() {
  const { signed } = useAuth();

  return signed ? (
    <BrowserRouter>
      <PermissionProvider>
          <LayoutProvider>
            <OtherRoutes />
          </LayoutProvider>
      </PermissionProvider>
    </BrowserRouter>
  ) : (
    <PublicRoutes />
  );
}

export default Routes;
