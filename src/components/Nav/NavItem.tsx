import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { RoutesProps } from '../../routes/OtherRoutes';
import { formatName } from './format';

interface NavItemProps {
  route: RoutesProps;
}

export function NavItem({ route }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(route.path);

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
        <span className="duration-700">{formatName(route.path)}</span>
      </NavLink>
    </li>
  );
}