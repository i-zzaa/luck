import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { RoutesProps } from '../../routes/OtherRoutes';

interface NavItemProps {
  route: RoutesProps;
}

export function NavItem({ route }: NavItemProps) {
  const location = useLocation();
  // route.path nunca tem barra inicial (ex: "pei"), mas location.pathname
  // sempre tem (ex: "/pei") — startsWith(route.path) comparava strings que
  // nunca podiam bater, então o item ativo do menu nunca acendia. Compara
  // com a barra e delimita por fim-de-segmento pra "/pei" não "acender"
  // também em "/pei-cadastro".
  const routePath = `/${route.path}`;
  const isActive =
    location.pathname === routePath ||
    location.pathname.startsWith(`${routePath}/`);

  return (
    <li
      key={route.path}
      className={clsx(
        'hover:px-0 hover:bg-primary-hover hover:text-primary-text-hover duration-700 grid justify-center',
        isActive ? 'bg-primary-hover text-primary-text-hover' : 'text-primary-text'
      )}
    >
      <NavLink to={route.path} className="grid grid-cols-2 gap-8 items-center text-sm px-4 py-4 cursor-pointer">
        <i className={clsx('text-end', route.icon)} />
        <span className="duration-700">{route.title}</span>
      </NavLink>
    </li>
  );
}