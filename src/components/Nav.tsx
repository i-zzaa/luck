import logoSm from '../assets/logo-md-write.png';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { permissionAuth } from '../contexts/permission';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { firtUpperCase } from '../util/util';
import { Menubar } from 'primereact/menubar';
import { useEffect, useState } from 'react';

export const Nav = () => {
  const { Logout } = useAuth();
  const { hasPermition, permissions } = permissionAuth();
  const [items, setItems] = useState([]);

  const RouterLinks: string[] = Object.values(CONSTANTES_ROUTERS);

  const activeClass =
    'font-medium hover:cursor-pointer text-white text-xs sm:text-base px-3 sm:py-6 font-sans  border-violet-800 md:border-white md:border-b-2';
  const desativeClass =
    'font-medium hover:cursor-pointer text-white text-xs sm:text-base px-3 sm:py-6 font-sans hover:border-white   border-none';

  const renderNav = () => {
    const arrRouterLinks = RouterLinks.filter((route: string) =>
      hasPermition(route)
    );
    const arr: any = arrRouterLinks.map((route: string) => {
      return (
        hasPermition(route) && {
          label: route,
          template: (item: any, options: any) => {
            return (
              <NavLink
                key={item.label}
                to={`${item.label}`}
                className={({ isActive }) =>
                  isActive ? activeClass : desativeClass
                }
              >
                {firtUpperCase(item.label)}
              </NavLink>
            );
          },
        }
      );
    });
    setItems(arr);
  };

  const menuEnd = (
    <NavLink
      to="/login"
      className="rounded-full bg-violet-800 p-1 mr-8 text-yellow-400 hover:text-violet-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
      onClick={Logout}
    >
      <span className="sr-only">Sair</span>
      <i className="pi pi-sign-out" />
    </NavLink>
  );

  useEffect(() => {
    renderNav();
  }, [permissions]);

  return (
    <Menubar
      className="bg-violet-800 fixed w-full mb-10 z-30 text-white h-16 rounded-none border-none p-2 text-sm font-sans"
      model={items}
      start={<img className="h-12 sm:h-24 py-2" src={logoSm} alt="logo" />}
      end={menuEnd}
    />
  );
};
