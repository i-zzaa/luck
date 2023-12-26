import { Routes, Route } from 'react-router-dom';
import { permissionAuth } from '../contexts/permission';
import { Layout } from '../foms/Layout';
import { Nav } from '../components/Nav';
import Home from '../pages/Home';
import { useContext } from 'react';
import { LayoutContext } from '../contexts/layout.context';
import { Protocolo } from '../pages/Protocolo';
import { Sessao } from '../pages/Sessao';
import { Prontuario } from '../pages/Prontuario';

export enum CONSTANTES_ROUTERS {
  HOME = 'home',
  CRUD = 'cadastro',
  CALENDAR = 'agenda',
  PRONTUARIO = 'prontuario',
}
export interface RoutesProps {
  path: string;
  componentRoute: any;
  icon: string
}

export const ROUTES = [
  { path: '*', componentRoute: Home, icon: '' },
  { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home, icon: 'pi pi-home' },
  // { path: CONSTANTES_ROUTERS.PRONTUARIO, componentRoute: Prontuario, icon: 'pi pi-book' },
  // { path: CONSTANTES_ROUTERS.CRUD, componentRoute: Crud, icon: 'pi pi-credit-card' },
  // { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule, icon: 'pi pi-calendar' },
]

const OtherRoutes = () => {
  const { hasPermition } = permissionAuth();
  const { open } = useContext(LayoutContext);

  const routes: RoutesProps[] = ROUTES;

  return (
    <div className="min-h-full overflow-hidden bg-background h-screen w-full">
      <Nav />
      <main  className='mt-14'>
        <Routes>
          {routes.map((route: RoutesProps, index: number) => (
            <Route
              key={index}
              path={route.path}
              element={
                // hasPermition(route.path) ? (
                  <Layout>
                    <route.componentRoute />
                  </Layout>
                // ) : null
              }
            />
          ))}
          <Route path="/protocolo" element={<Protocolo />} />
          <Route path="/sessao" element={<Sessao />} />
        </Routes>
      </main>
    </div>
  );
};

export default OtherRoutes;
