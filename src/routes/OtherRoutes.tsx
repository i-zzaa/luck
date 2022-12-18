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

export enum CONSTANTES_ROUTERS {
  HOME = 'home',
  DASHBOARD = 'dashboard',
  QUEUE = 'fila',
  CRUD = 'cadastro',
  CALENDAR = 'agenda',
  FINANCEIRO = 'financeiro',
}
interface Props {
  path: string;
  componentRoute: any;
}

const OtherRoutes = () => {
  const { hasPermition } = permissionAuth();

  const routes: Props[] = [
    { path: '*', componentRoute: Home },
    { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home },
    { path: CONSTANTES_ROUTERS.DASHBOARD, componentRoute: Dashboard },
    { path: CONSTANTES_ROUTERS.CRUD, componentRoute: Crud },
    { path: CONSTANTES_ROUTERS.QUEUE, componentRoute: Queue },
    { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule },
    { path: CONSTANTES_ROUTERS.FINANCEIRO, componentRoute: Financial },
  ];

  return (
    <div className="min-h-full overflow-hidden">
      <Nav />
      <Routes>
        {routes.map((route: Props, index: number) => (
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
    </div>
  );
};

export default OtherRoutes;
