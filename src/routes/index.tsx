import { useAuth } from '../contexts/auth';
import { BrowserRouter } from 'react-router-dom';
import { PermissionProvider } from '../contexts/permission';
import { DropdownProvider } from '../contexts/dropDown';
import React from 'react';

const OtherRoutes = React.lazy(() => import('./OtherRoutes'));
const PublicRoutes = React.lazy(() => import('./PublicRoutes'));

function Routes() {
  const { signed } = useAuth();

  return signed ? (
    <BrowserRouter>
      <PermissionProvider>
        <DropdownProvider>
          <OtherRoutes />
        </DropdownProvider>
      </PermissionProvider>
    </BrowserRouter>
  ) : (
    <PublicRoutes />
  );
}

export default Routes;
