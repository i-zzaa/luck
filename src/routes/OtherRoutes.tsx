import { Routes, Route } from 'react-router-dom';
import { Layout } from '../foms/Layout';
import { Nav } from '../components/Nav';
import Home from '../pages/Home';
import { Schedule } from '../pages/Schedule';

export enum CONSTANTES_ROUTERS {
  HOME = 'home',
  CRUD = 'cadastro',
  CALENDAR = 'agenda'
}
export interface RoutesProps {
  path: string;
  componentRoute: any;
  icon: string
}

export const ROUTES = [
  { path: '*', componentRoute: Home, icon: '' },
  { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home, icon: 'pi pi-home' },
  { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule, icon: 'pi pi-calendar' },
]

const OtherRoutes = () => {

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
                <Layout>
                  <route.componentRoute />
                </Layout>
              }
            />
          ))}
        </Routes>
      </main>
    </div>
  );
};

export default OtherRoutes;
