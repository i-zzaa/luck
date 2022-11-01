import logoSm from "../assets/logo-md-write.png";
import {  NavLink } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import { permissionAuth } from "../contexts/permission";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { firtUpperCase } from "../util/util";

export const Nav = () => {
  const { Logout } = useAuth();
  const { hasPermition } = permissionAuth();

  const RouterLinks: string[] = Object.values(CONSTANTES_ROUTERS);

  const activeClass =
    "font-medium hover:cursor-pointer text-white text-xs sm:text-base sm:leading-[3rem]  px-3 py-2 leading-[2.9rem]  hover:border-white  hover:border-b-2  border-b-2 border-white";
  const desativeClass =
    "font-medium hover:cursor-pointer text-white text-xs sm:text-base sm:leading-[3rem]  px-3 py-2 leading-[2.9rem]  hover:border-white  hover:border-b-2 border-none";

  const renderNav = () => {
    return RouterLinks.map((item: string) =>
      hasPermition(item) ? (
        <NavLink
          key={item}
          to={`${item}`}
          className={({ isActive }) => (isActive ? activeClass : desativeClass)}
        >
          {firtUpperCase(item)}
        </NavLink>
      ) : undefined
    );
  };

  return (
    <>
      <nav className="bg-violet-800 fixed w-full mb-10 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img className="h-12 sm:h-24 py-2" src={logoSm} alt="logo" />
              </div>
              <div className="">
                <div className="sm:ml-10 flex items-baseline space-x-4">
                  {renderNav()}
                </div>
              </div>
            </div>

            <div className="">
              <div className="flex items-center ml-6">
                <NavLink
                  to="/login"
                  className="rounded-full bg-violet-800 p-1 text-yellow-400 hover:text-violet-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  onClick={Logout}
                >
                  <span className="sr-only">Sair</span>
                  <i className="pi pi-sign-out" />
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
