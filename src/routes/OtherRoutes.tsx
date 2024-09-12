import { Routes, Route } from 'react-router-dom';
import { Layout } from '../foms/Layout';
import { Nav } from '../components/Nav';
import Home from '../pages/Home';
import { Schedule } from '../pages/Schedule';
import { Session } from '../pages/Session';
import DTT from '../components/DTT';
import PEI from '../pages/PEI';
import PEICADASTRO from '../foms/PEI';
import MetasDTT from '../pages/MetasDTT';
import PrimeiraResposta from '../pages/PrimeiraResposta';
import PROTOCOLO from '../foms/Protocolo';

export enum CONSTANTES_ROUTERS {
  HOME = 'home',
  CRUD = 'cadastro',
  CALENDAR = 'agenda',
  SESSION = 'session',
  DTT = 'dtt',
  PEI = 'pei',
  PEICADASTRO = 'pei-cadastro',
  METASDTT = 'metas-dtt',
  PRIMEIRARESPOSTA = 'primeira-resposta',
  PROTOCOLO = 'protocolo',
}
export interface RoutesProps {
  path: string;
  componentRoute: any;
  icon: string;
  menu?: boolean;
}

export const ROUTES = [
  { path: '*', componentRoute: Home, icon: '', menu: false },
  { path: CONSTANTES_ROUTERS.SESSION, componentRoute: Session, icon: '', menu: false },
  { path: CONSTANTES_ROUTERS.DTT, componentRoute: DTT, icon: '', menu: false },
  { path: CONSTANTES_ROUTERS.METASDTT, componentRoute: MetasDTT, icon: '', menu: false },
  { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home, icon: 'pi pi-home', menu: true },
  { path: CONSTANTES_ROUTERS.PEI, componentRoute: PEI, icon: 'pi pi-book', menu: true },
  { path: CONSTANTES_ROUTERS.PROTOCOLO, componentRoute: PROTOCOLO, icon: 'pi pi-book', menu: true },
  { path: CONSTANTES_ROUTERS.PEICADASTRO, componentRoute: PEICADASTRO, icon: '', menu: false },
  { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule, icon: 'pi pi-calendar', menu: true },
  { path: CONSTANTES_ROUTERS.PRIMEIRARESPOSTA, componentRoute: PrimeiraResposta, icon: 'pi pi-check-square', menu: true },
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
