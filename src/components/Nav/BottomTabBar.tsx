import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useMenuItems } from './useMenuItems';
import { BOTTOM_TAB_BAR_HEIGHT, BOTTOM_TAB_BAR_OFFSET } from './bottomTabBarLayout';
import { CONSTANTES_ROUTERS } from '../../routes/OtherRoutes';

// Item ativo = mesma regra de match usada em usePageTitle/useIsTabRoute:
// route.path nunca tem barra inicial, então compara com "/" + path,
// delimitando por fim-de-segmento pra "/pei" não bater em "/pei-cadastro".
//
// "/" (raiz, sem navigate() explícito pós-login) cai no fallback '*' das
// ROUTES, que renderiza Home — mas "/" nunca bate com "/home" na
// comparação normal, então sem esse caso especial NENHUM item ficava
// destacado bem na primeira tela que o usuário vê (ver useIsTabRoute.ts
// pro mesmo caso, aplicado a "a tab bar aparece ou não").
const useIsActiveTab = (path: string) => {
  const { pathname } = useLocation();
  if (pathname === '/') return path === CONSTANTES_ROUTERS.HOME;

  const routePath = `/${path}`;
  return pathname === routePath || pathname.startsWith(`${routePath}/`);
};

// Rótulo curto só na tab bar: o `title` da rota é o título da página
// ("Protocolo de Avaliação", "Primeira Resposta") e cortava em "Protocol…"
// / "Primeira…" nos 5 slots da barra.
// Função, não constante de módulo: OtherRoutes importa (via Nav) este
// arquivo, e no load do módulo CONSTANTES_ROUTERS ainda é undefined
// (import circular) — ler na hora de renderizar evita isso.
const rotuloCurto = (path: string, title: string) => {
  if (path === CONSTANTES_ROUTERS.PROTOCOLO) return 'Protocolo';
  if (path === CONSTANTES_ROUTERS.PRIMEIRARESPOSTA) return '1ª resposta';
  return title;
};

function TabBarItem({ route }: { route: { path: string; icon: string; title: string } }) {
  const isActive = useIsActiveTab(route.path);

  return (
    <NavLink
      to={route.path}
      aria-current={isActive ? 'page' : undefined}
      className="flex-1 flex items-center justify-center h-full min-w-0"
    >
      {/* Item ativo só por cor + peso (sem o bloco de fundo de antes). */}
      <div className="flex flex-col items-center justify-center gap-1 h-[3.25rem] min-w-[3.25rem] px-1 duration-300">
        <i
          className={clsx(
            route.icon,
            'text-lg duration-300',
            // item não-selecionado: escuro (mesma cor de texto/ícone da
            // referência — TabBar.tsx do desafiaê usa colors.text, não um
            // cinza claro), só o selecionado fica na cor primária.
            isActive ? 'text-primary' : 'text-gray-800'
          )}
        />
        <span
          className={clsx(
            'text-[11px] leading-none whitespace-nowrap duration-300',
            isActive ? 'text-primary font-bold' : 'text-gray-800 font-semibold'
          )}
        >
          {rotuloCurto(route.path, route.title)}
        </span>
      </div>
    </NavLink>
  );
}

// Agenda é a ação mais usada da tela — vira o botão central, sem rótulo,
// preenchido na cor primária. Estrutura igual TabBar.tsx do desafiaê:
// fabRing (anel na cor da barra, um respiro em volta) + fab (círculo de
// tamanho fixo, não esticado pra largura do slot) por dentro.
function AgendaFab({ route }: { route: { path: string; icon: string; title: string } }) {
  return (
    <NavLink
      to={route.path}
      aria-label={route.title}
      className="flex-1 flex items-center justify-center h-full min-w-0"
    >
      <div className="p-1.5 rounded-full bg-white shadow-3xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary">
          <i className={clsx(route.icon, 'text-[1.5rem] text-primary-text')} />
        </div>
      </div>
    </NavLink>
  );
}

// Tab bar flutuante fixa no rodapé — só renderiza nas 5 rotas "de topo"
// (ver useIsTabRoute, consultado por quem monta este componente). Pill
// branca arredondada, com a Agenda (ação mais usada) como botão central
// preenchido na cor primária — mesmo padrão visual de referência
// (components/TabBar.tsx do desafiaê).
export function BottomTabBar() {
  const menuItems = useMenuItems();

  const agenda = menuItems.find((r) => r.path === CONSTANTES_ROUTERS.CALENDAR);
  const others = menuItems.filter((r) => r.path !== CONSTANTES_ROUTERS.CALENDAR);
  // 2 à esquerda, Agenda no centro, 2 à direita
  const meio = Math.ceil(others.length / 2);
  const esquerda = others.slice(0, meio);
  const direita = others.slice(meio);

  return (
    <nav
      className={clsx(
        'fixed inset-x-4 z-20 rounded-full bg-white shadow-3xl',
        BOTTOM_TAB_BAR_OFFSET,
        BOTTOM_TAB_BAR_HEIGHT
      )}
    >
      <div className="flex items-stretch h-full px-1">
        {esquerda.map((route) => (
          <TabBarItem key={route.path} route={route} />
        ))}
        {agenda && <AgendaFab route={agenda} />}
        {direita.map((route) => (
          <TabBarItem key={route.path} route={route} />
        ))}
      </div>
    </nav>
  );
}
