import { Routes, Route } from 'react-router-dom';
import { permissionAuth } from '../contexts/permission';
import { Layout } from '../foms/Layout';
import { Nav } from '../components/Nav';
import { Crud } from '../pages/Crud';
import Dashboard from '../pages/Dashboard';
import Home from '../pages/Home';
import Queue from '../pages/Queue';
import Schedule from '../pages/Schedule';
import Financial from '../pages/Financial';
import { useContext } from 'react';
import { LayoutContext } from '../contexts/layout.context';

export enum CONSTANTES_ROUTERS {
  HOME = 'home',
  DASHBOARD = 'dashboard',
  QUEUE = 'fila',
  CRUD = 'cadastro',
  CALENDAR = 'agenda',
  FINANCEIRO = 'financeiro',
}
export interface RoutesProps {
  path: string;
  componentRoute: any;
  icon: string
}

export const ROUTES = [
  { path: '*', componentRoute: Home, icon: '' },
  { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home, icon: 'pi pi-home' },
  { path: CONSTANTES_ROUTERS.DASHBOARD, componentRoute: Dashboard, icon: 'pi pi-chart-pie' },
  { path: CONSTANTES_ROUTERS.CRUD, componentRoute: Crud, icon: 'pi pi-credit-card' },
  { path: CONSTANTES_ROUTERS.QUEUE, componentRoute: Queue , icon: 'pi pi-sort-amount-down'},
  { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule, icon: 'pi pi-calendar' },
  { path: CONSTANTES_ROUTERS.FINANCEIRO, componentRoute: Financial , icon: 'pi pi-money-bill'},
]

const OtherRoutes = () => {
  const { hasPermition } = permissionAuth();
  const { open } = useContext(LayoutContext);

  const routes: RoutesProps[] = ROUTES;

  return (
    <div className="min-h-full overflow-hidden bg-background h-screen w-full">
      <Nav />
      <main className={`${ open ? 'ml-36' : 'ml-14'} p-4 duration-700`}>
        <Routes>
          {routes.map((route: RoutesProps, index: number) => (
            <Route
              key={index}
              path={route.path}
              element={
                hasPermition(route.path) ? (
                  <Layout>
                    <route.componentRoute />
                  </Layout>
                ) : null
              }
            />
          ))}
        </Routes>
      </main>
    </div>
  );
};

export default OtherRoutes;
