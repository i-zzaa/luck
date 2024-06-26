import { Routes, Route } from 'react-router-dom';
import { Layout } from '../foms/Layout';
import { Nav } from '../components/Nav';
import Home from '../pages/Home';
import { Schedule } from '../pages/Schedule';
import { Session } from '../pages/Session';

export enum CONSTANTES_ROUTERS {
  HOME = 'home',
  CRUD = 'cadastro',
  CALENDAR = 'agenda',
  SESSION = 'session',
}
export interface RoutesProps {
  path: string;
  componentRoute: any;
  icon: string;
  menu?: boolean;
}

export const ROUTES = [
  { path: '*', componentRoute: Home, icon: '', menu: false },
  // { path: CONSTANTES_ROUTERS.SESSION, componentRoute: Session, icon: '', menu: false },
  { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home, icon: 'pi pi-home', menu: true },
  { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule, icon: 'pi pi-calendar', menu: true },
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

            <Route
              key={CONSTANTES_ROUTERS.SESSION}
              path={CONSTANTES_ROUTERS.SESSION}
              element={
                <Layout>
                  <Session />
                </Layout>
              }
            />
        </Routes>
      </main>
    </div>
  );
};

export default OtherRoutes;
