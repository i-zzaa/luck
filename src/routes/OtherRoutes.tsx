import { Routes, Route } from "react-router-dom";


// import * as AlertDialog from "@radix-ui/react-alert-dialog";
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
  const { hasPermition } = permissionAuth();

  // const routes: Props[] = [
  //   { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home },
  //   { path: CONSTANTES_ROUTERS.DASHBOARD, componentRoute: Dashboard },
  //   { path: CONSTANTES_ROUTERS.CRUD, componentRoute: Crud },
  // { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule },
  // ];

  // const renderRoutes = () => {
  //   return routes.map((item: Props) => hasPermition(CONSTANTES_ROUTERS.HOME) ? (
  //     <Route
  //       path={`/${CONSTANTES_ROUTERS.HOME}`}
  //       element={
  //         <Layout>
  //           <Home />
  //         </Layout>
  //       }
  //     />
  //   ) : null)
  // }

  return (
    <div className="min-h-full overflow-hidden">
      <>
        <Nav />
        <Routes>
          <Route
            path="*"
            element={
              <Layout>
                {hasPermition(CONSTANTES_ROUTERS.HOME) ? <Home /> : <Queue />}
              </Layout>
            }
          />
          {hasPermition(CONSTANTES_ROUTERS.HOME) ? (
            <Route
              path={`/${CONSTANTES_ROUTERS.HOME}`}
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
          ) : null}
          {hasPermition(CONSTANTES_ROUTERS.DASHBOARD) ? (
            <Route
              path={`/${CONSTANTES_ROUTERS.DASHBOARD}`}
              element={
     
                  <Dashboard />
      
              }
            />
          ) : null}
          {hasPermition(CONSTANTES_ROUTERS.CRUD) ? (
            <Route
              path={`/${CONSTANTES_ROUTERS.CRUD}`}
              element={
                <Layout>
                  <Crud />
                </Layout>
              }
            />
          ) : null}
          {hasPermition(CONSTANTES_ROUTERS.QUEUE) ? (
            <Route
              path={`/${CONSTANTES_ROUTERS.QUEUE}`}
              element={
                <Layout>
                  <Queue />
                </Layout>
              }
            />
          ) : null}

          {hasPermition(CONSTANTES_ROUTERS.CALENDAR) ? (
            <Route
              path={`/${CONSTANTES_ROUTERS.CALENDAR}`}
              element={
                <Layout>
                  <Schedule />
                </Layout>
              }
            />
          ) : null}
        </Routes>
      </>
    </div>
  );
};

export default OtherRoutes;
