import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { LayoutContext } from '../../contexts/layout.context';
import { ButtonHeron } from '../button';
import { NavItem } from './NavItem';
import { useSidebarMenu } from './useSidebarMenu';

export const Nav = () => {
  const navigate = useNavigate();
  const { Logout } = useContext(AuthContext);
  const { user, perfil } = useContext(AuthContext);
  const { open, setOpen } = useContext(LayoutContext);
  const menuSidebar = useSidebarMenu();

  const renderOpen = () => (
    <aside
      onClick={() => setOpen(false)}
      className="fixed border-box shadow-3xl w-full h-screen z-20 bg-primary duration-700 ease-in-out justify-center"
    >
      <div className="bg-logo-md-write bg-no-repeat bg-cover h-[13rem] w-[20rem] mx-auto" />
      <div className="border-y border-primary-text duration-1000 p-4 mt-2">
        <h3 className="text-primary-text text-center font-light text-sm">{user.nome}</h3>
        <h3 className="text-gray-200 text-center font-light text-xs">{perfil}</h3>
      </div>
      <ul className="list-none p-0 mt-8">
        {menuSidebar.map((route) => (
          <NavItem key={route.path} route={route} />
        ))}
      </ul>
      <i
        onClick={Logout}
        className="pi pi-sign-out duration-700 text-primary-text hover:scale-125 cursor-pointer w-4 col-span-1 fixed bottom-8 left-[50%]"
      />
    </aside>
  );

  const renderClose = () => (
    <aside className="fixed w-full right-2 shadow-3xl h-12 z-20 bg-primary duration-700 ease-in-out cursor-pointer">
      <div className="flex justify-between items-center">
        <div className="sm:text-end ml-2">
          <ButtonHeron
            text=""
            icon="pi pi-arrow-left"
            type="primary"
            color="white"
            size="icon"
            onClick={() => navigate(-1)}
          />
        </div>
        <div className="w-12 h-12 mt-[1vh] rounded-3xl bg-primary" onClick={() => setOpen(true)}>
          <div className="bg-logo-mini bg-no-repeat bg-cover h-12 w-12 duration-700" />
        </div>
      </div>
    </aside>
  );

  return open ? renderOpen() : <nav className="fixed h-12 w-full bg-primary mb-8">{renderClose()}</nav>;
};