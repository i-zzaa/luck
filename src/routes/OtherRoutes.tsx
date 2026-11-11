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
const Resumos = lazy(() => import('../pages/Resumos'));
const Pacientes = lazy(() => import('../pages/Pacientes'));
const Paciente = lazy(() => import('../pages/Paciente'));

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
  RESUMOS = 'resumos',
  PACIENTES = 'pacientes',
  PACIENTE = 'paciente/:id',
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
  // Sessão aberta pelo id do calendário na URL (sobrevive a F5/link direto
  // — o evento vem de GET /sessao/calendario/:id).
  { path: `${CONSTANTES_ROUTERS.SESSION}/:calendarioId`, componentRoute: Session, icon: '', menu: false, title: 'Sessão' },
  { path: CONSTANTES_ROUTERS.DTT, componentRoute: DTT, icon: '', menu: false, title: 'DTT' },
  { path: CONSTANTES_ROUTERS.METAS, componentRoute: Metas, icon: '', menu: false, title: 'Metas' },
  // Tab bar: Início, Agenda (botão central) e Pacientes. Protocolo, PEI,
  // 1ª resposta e Resumos começam todos pelo paciente, então saíram da
  // barra e ficam na tela do paciente (menu: false = tela de detalhe, com
  // "voltar" e sem a tab bar). As rotas continuam valendo por link direto.
  { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home, icon: 'pi pi-home', menu: true, title: 'Início' },
  { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule, icon: 'pi pi-calendar', menu: true, title: 'Agenda' },
  { path: CONSTANTES_ROUTERS.PACIENTES, componentRoute: Pacientes, icon: 'pi pi-users', menu: true, title: 'Pacientes' },
  { path: CONSTANTES_ROUTERS.PACIENTE, componentRoute: Paciente, icon: '', menu: false, title: 'Paciente' },
  { path: CONSTANTES_ROUTERS.PROTOCOLO, componentRoute: PROTOCOLO, icon: 'pi pi-verified', menu: false, title: 'Protocolo de Avaliação' },
  { path: CONSTANTES_ROUTERS.PEICADASTRO, componentRoute: PEICADASTRO, icon: '', menu: false, title: 'Cadastro de PEI' },
  { path: CONSTANTES_ROUTERS.PEI, componentRoute: PEI, icon: 'pi pi-book', menu: false, title: 'PEI' },
  { path: CONSTANTES_ROUTERS.PRIMEIRARESPOSTA, componentRoute: PrimeiraResposta, icon: 'pi pi-check-square', menu: false, title: 'Primeira Resposta' },
  // Folha de "Relatório evolutivo de sessão": resumos assinados do mês.
  { path: CONSTANTES_ROUTERS.RESUMOS, componentRoute: Resumos, icon: 'pi pi-file-edit', menu: false, title: 'Resumos de Sessão' },
]

const OtherRoutes = () => {

  const routes: RoutesProps[] = ROUTES;
  const { mustChangePassword } = useAuth();

  return (
    // 100dvh = altura visível de verdade (h-screen/100vh no iOS inclui a
    // barra do navegador). flex-col + main flex-1 min-h-0: o scroll do
    // LayoutDefault ocupa só o que sobra abaixo do header (mt-14). Antes
    // ele tinha h-screen inteiro empurrado 3,5rem pra baixo, então o fim
    // de toda tela (incluindo a reserva da tab bar) ficava fora da tela.
    // A reserva de espaço da tab bar fica no LayoutDefault.
    <div className="flex flex-col overflow-hidden bg-background h-[100dvh] w-full">
      <Nav />
      <main className="flex-1 min-h-0 mt-14">
        {/* Enquanto a troca de senha obrigatória estiver pendente, as
            páginas não são montadas: evita que telas por trás do modal
            disparem requisições que o backend vai bloquear (e encher a
            tela de toasts de erro) antes do usuário conseguir trocar a
            senha. */}
        {!mustChangePassword && (
          <Suspense fallback={<LoadingHeron />}>
            <Routes>
              {routes.map((route: RoutesProps) => (
                <Route
                  key={route.path}
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
