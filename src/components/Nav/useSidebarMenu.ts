import { useEffect, useState } from 'react';
import { ROUTES, RoutesProps } from '../../routes/OtherRoutes';

export function useSidebarMenu(): RoutesProps[] {
  const [menuSidebar, setMenuSidebar] = useState<RoutesProps[]>([]);

  useEffect(() => {
    const filteredRoutes = ROUTES.filter((route) => route.path !== '*' && route.menu);
    setMenuSidebar(filteredRoutes);
  }, []);

  return menuSidebar;
}