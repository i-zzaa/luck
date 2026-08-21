import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { ROUTES } from '../../routes/OtherRoutes';

// Acha o título da rota atual pra exibir no header fixo (Nav). Mesma
// lógica de match do NavItem: route.path nunca tem barra inicial, então
// compara com "/" + path, delimitando por fim-de-segmento pra "/pei" não
// bater também em "/pei-cadastro".
export function usePageTitle(): string {
  const { pathname } = useLocation();

  return useMemo(() => {
    const match = ROUTES.find((route) => {
      if (route.path === '*') return false;
      const routePath = `/${route.path}`;
      return pathname === routePath || pathname.startsWith(`${routePath}/`);
    });

    return match?.title ?? '';
  }, [pathname]);
}
