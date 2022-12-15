import { Routes, Route } from "react-router-dom";
import { permissionAuth } from "../contexts/permission";
import { Layout } from "../foms/Layout";
import { Nav } from "../components/Nav";
import { Crud } from "../pages/Crud";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import Queue from "../pages/Queue";
import Schedule from "../pages/Schedule";

export enum CONSTANTES_ROUTERS {
  HOME = "home",
  DASHBOARD = "dashboard",
  QUEUE = "fila",
  CRUD = "cadastro",
  CALENDAR = "agenda",
}
interface Props {
  path: string;
  componentRoute: any;
}

const OtherRoutes = () => {
  const { hasPermition, permissions } = permissionAuth();

  const routes: Props[] = [
    { path: '*', componentRoute: Home },
    { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home },
    { path: CONSTANTES_ROUTERS.DASHBOARD, componentRoute: Dashboard },
    { path: CONSTANTES_ROUTERS.CRUD, componentRoute: Crud },
    { path: CONSTANTES_ROUTERS.QUEUE, componentRoute: Queue },
    { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule },
  ];

  return (
    <div className="min-h-full overflow-hidden">
      <Nav />
      <Routes>
        {routes.map((route: Props, index: number) => (
          <Route key={index} path={route.path} element={
            permissions.includes(route.path) ? <Layout><route.componentRoute /></Layout> : null
          } />
        ))}
      </Routes>
    </div>
  )

};

export default OtherRoutes;
