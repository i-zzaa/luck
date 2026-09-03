import { useMemo } from 'react';
import { ROUTES, RoutesProps } from '../../routes/OtherRoutes';

// Renomeado de useSidebarMenu: não existe mais sidebar, isso alimenta a
// tab bar flutuante (BottomTabBar) — mesma fonte de dados (ROUTES com
// menu: true), só o nome que não fazia mais sentido.
export function useMenuItems(): RoutesProps[] {
  // ROUTES é uma constante de módulo, nunca muda em runtime — guardar isso
  // em useState+useEffect fazia o menu renderizar vazio no primeiro
  // paint e só preencher depois do efeito, um flash desnecessário a cada
  // mount. useMemo calcula na hora, sem o segundo render.
  return useMemo(
    () => ROUTES.filter((route) => route.path !== '*' && route.menu),
    []
  );
}
