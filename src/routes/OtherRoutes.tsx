import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutDefault } from '../components/layoutDefault';
import { Nav } from '../components/Nav';
import { LoadingHeron } from '../components/loading';
import { MustChangePasswordModal } from '../components/mustChangePasswordModal';
import { useAuth } from '../contexts/auth';

// Cada rota antes era importada de forma estática, então navegar pra
// QUALQUER tela baixava o JS de TODAS elas de uma vez — incluindo libs
// pesadas usadas só numa página (ex: jodit-react, ~228KB gzip, só é usado
// no editor de resumo da Sessão). lazy() faz cada rota virar um chunk
// separado, baixado só quando o usuário navega até ela.
const Home = lazy(() => import('../pages/Home'));
const Schedule = lazy(() => import('../pages/Schedule').then((m) => ({ default: m.Schedule })));
const Session = lazy(() => import('../pages/session/Session').then((m) => ({ default: m.Session })));
const DTT = lazy(() => import('../components/DTT'));
const PEI = lazy(() => import('../pages/PEI'));
const PrimeiraResposta = lazy(() => import('../pages/PrimeiraResposta'));
const PROTOCOLO = lazy(() => import('../foms/Protocolo'));
const Metas = lazy(() => import('../pages/Metas'));
const PEICADASTRO = lazy(() => import('../foms/pei'));

export enum CONSTANTES_ROUTERS {
  HOME = 'home',
  CRUD = 'cadastro',
  CALENDAR = 'agenda',
  SESSION = 'session',
  DTT = 'dtt',
  PEI = 'pei',
  PEICADASTRO = 'pei-cadastro',
  METAS = 'metas',
  PRIMEIRARESPOSTA = 'primeira-resposta',
  PROTOCOLO = 'protocolo-av',
}
export interface RoutesProps {
  path: string;
  componentRoute: any;
  icon: string;
  menu?: boolean;
  // Nome exibido no header fixo (Nav) e, quando menu:true, no item do
  // menu lateral. Existe separado do path porque formatName(path) não dá
  // conta de nomes com acento/preposição ("protocolo-av" -> "Protocolo de
  // Avaliação") nem de siglas ("pei" -> "PEI").
  title: string;
}

export const ROUTES = [
  { path: '*', componentRoute: Home, icon: '', menu: false, title: 'Início' },
  { path: CONSTANTES_ROUTERS.SESSION, componentRoute: Session, icon: '', menu: false, title: 'Sessão' },
  { path: CONSTANTES_ROUTERS.DTT, componentRoute: DTT, icon: '', menu: false, title: 'DTT' },
  { path: CONSTANTES_ROUTERS.METAS, componentRoute: Metas, icon: '', menu: false, title: 'Metas' },
  { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home, icon: 'pi pi-home', menu: true, title: 'Início' },
  { path: CONSTANTES_ROUTERS.PEI, componentRoute: PEI, icon: 'pi pi-book', menu: true, title: 'PEI' },
  { path: CONSTANTES_ROUTERS.PROTOCOLO, componentRoute: PROTOCOLO, icon: 'pi pi-book', menu: true, title: 'Protocolo de Avaliação' },
  { path: CONSTANTES_ROUTERS.PEICADASTRO, componentRoute: PEICADASTRO, icon: '', menu: false, title: 'Cadastro de PEI' },
  { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule, icon: 'pi pi-calendar', menu: true, title: 'Agenda' },
  { path: CONSTANTES_ROUTERS.PRIMEIRARESPOSTA, componentRoute: PrimeiraResposta, icon: 'pi pi-check-square', menu: true, title: 'Primeira Resposta' },
]

const OtherRoutes = () => {

  const routes: RoutesProps[] = ROUTES;
  const { mustChangePassword } = useAuth();

  return (
    <div className="min-h-full overflow-hidden bg-background h-screen w-full">
      <Nav />
      <main  className='mt-14'>
        {/* Enquanto a troca de senha obrigatória estiver pendente, as
            páginas não são montadas: evita que telas por trás do modal
            disparem requisições que o backend vai bloquear (e encher a
            tela de toasts de erro) antes do usuário conseguir trocar a
            senha. */}
        {!mustChangePassword && (
          <Suspense fallback={<LoadingHeron />}>
            <Routes>
              {routes.map((route: RoutesProps, index: number) => (
                <Route
                  key={index}
                  path={route.path}
                  element={
                    <LayoutDefault>
                      <route.componentRoute />
                    </LayoutDefault>
                  }
                />
              ))}
            </Routes>
          </Suspense>
        )}
      </main>
      <MustChangePasswordModal />
    </div>
  );
};

export default OtherRoutes;
