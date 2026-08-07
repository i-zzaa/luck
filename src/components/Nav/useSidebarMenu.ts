import { useMemo } from 'react';
import { ROUTES, RoutesProps } from '../../routes/OtherRoutes';

export function useSidebarMenu(): RoutesProps[] {
  // ROUTES é uma constante de módulo, nunca muda em runtime — guardar isso
  // em useState+useEffect fazia o menu lateral renderizar vazio no
  // primeiro paint e só preencher depois do efeito, um flash desnecessário
  // a cada mount. useMemo calcula na hora, sem o segundo render.
  return useMemo(
    () => ROUTES.filter((route) => route.path !== '*' && route.menu),
    []
  );
}
