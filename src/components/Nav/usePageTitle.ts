import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { CONSTANTES_ROUTERS, ROUTES } from '../../routes/OtherRoutes';

// Acha o título da rota atual pra exibir no header fixo (Nav). Mesma
// lógica de match usada em BottomTabBar/useIsTabRoute: route.path nunca
// tem barra inicial, então compara com "/" + path, delimitando por
// fim-de-segmento pra "/pei" não bater também em "/pei-cadastro".
export function usePageTitle(): string {
  const { pathname } = useLocation();

  return useMemo(() => {
    // "/" (raiz, sem navigate() explícito pós-login) cai no fallback '*'
    // das ROUTES, que renderiza Home — mas como o path:'*' é excluído do
    // match abaixo (regra própria, pra não roubar o título de rotas
    // reais) e "/" nunca bate com "/home", o título ficava em branco
    // bem na primeira tela que o usuário vê. Ver mesmo caso em
    // BottomTabBar.tsx/useIsTabRoute.ts.
    if (pathname === '/') {
      return ROUTES.find((route) => route.path === CONSTANTES_ROUTERS.HOME)?.title ?? '';
    }

    const match = ROUTES.find((route) => {
      if (route.path === '*') return false;
      const routePath = `/${route.path}`;
      return pathname === routePath || pathname.startsWith(`${routePath}/`);
    });

    return match?.title ?? '';
  }, [pathname]);
}
