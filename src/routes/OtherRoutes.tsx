import { Routes, Route } from "react-router-dom";


// import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { permissionAuth } from "../contexts/permission";
import { Layout } from "../foms/Layout";
import { Nav } from "../foms/Nav";
import { Crud } from "../pages/Crud";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import Patient from "../pages/Patient";
import Schedule from "../pages/Schedule";

export enum CONSTANTES_ROUTERS {
  HOME = "home",
  DASHBOARD = "dashboard",
  // PATIENT = "pacientes",
  CRUD = "cadastro",
  CALENDAR = "Calendário",
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
                {hasPermition(CONSTANTES_ROUTERS.HOME) ? <Home /> : <Patient />}
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
                <Layout>
                  <Dashboard />
                </Layout>
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

          {hasPermition(CONSTANTES_ROUTERS.CRUD) ? (
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
