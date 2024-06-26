import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext, useAuth } from '../contexts/auth';
import { permissionAuth } from '../contexts/permission';
import { ROUTES, RoutesProps } from '../routes/OtherRoutes';
import { firtUpperCase } from '../util/util';
import { useContext, useEffect, useState } from 'react';
import { LayoutContext } from '../contexts/layout.context';
import clsx from 'clsx';

export const Nav = () => {
  const { Logout } = useAuth();
  const { hasPermition, permissions } = permissionAuth();
  const { open, setOpen } = useContext(LayoutContext);
  const [ menuSidebar, setMenuSidebar ] = useState<RoutesProps[]>([]);
  const { user, perfil } = useContext(AuthContext);

  const location = useLocation()
  
  const renderNav = () => {
    // const arrRouterLinks = ROUTES.filter((route: RoutesProps) =>
    //   hasPermition(route.path) && route.path !== '*'
    // );
    const arrRouterLinks = ROUTES.filter((route: RoutesProps) =>
       route.path !== '*'
    );
    setMenuSidebar(arrRouterLinks);
  };

  const renderOpen = () => {
    return (
      <aside onClick={()=>  setOpen(false)} className={'fixed border-box shadow-3xl w-full h-screen z-20  bg-primary duration-700 ease-in-out justify-center'}>
       <div className="bg-logo-md-write bg-no-repeat bg-cover h-[13rem] "></div> 
       <div className='border-y border-primary-text duration-1000 p-4 mt-2'>
       <h3 className="text-primary-text text-center font-light text-sm "> {  user.nome  }</h3>  
       <h3 className="text-gray-200 text-center font-light text-xs "> { firtUpperCase(perfil) } </h3> 

       </div>
       <ul className="list-none p-0 mt-8">
        {
          menuSidebar.map((element: any) => {
            const isActive = location.pathname.startsWith(element.path)
            return (
              <li  key={element.path} className={`${isActive ? 'bg-primary-hover text-primary-text-hover' :  'text-primary-text'} hover:px-0 hover:bg-primary-hover  hover:text-primary-text-hover duration-700 grid  justify-center`} >
                <NavLink  to={element.path} className='grid grid-cols-2 gap-8 items-center text-sm px-4 py-4  cursor-pointer'>
                  <i className={clsx('text-end', element.icon)} />
                  <span  className='duration-700'>{firtUpperCase(element.path) }</span>
                </NavLink>
              </li>
            )
          })
        }
        </ul>
        <i onClick={Logout} className={` pi pi-sign-out duration-700 text-primary-text hover:scale-125 cursor-pointer  w-4 col-span-1 fixed bottom-8 left-6`} />
      </aside>
    )
  }

  const renderClose = () => {
    return (
      <aside onClick={()=>  setOpen(true)} className={'fixed shadow-3xl w-12 h-12 z-20 mt-[1vh] right-2 rounded-3xl bg-primary duration-700 ease-in-out hover:scale-[105%] cursor-pointer'}>
        <div className="bg-logo-mini    bg-no-repeat bg-cover h-12 w-12 duration-700"></div>
      </aside>
    )
  }

  useEffect(() => {
    renderNav()
  }, [permissions]);

  return open ? renderOpen() : <nav className='fixed h-12 w-full bg-primary mb-8'>{renderClose()}</nav>
};
