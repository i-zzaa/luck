import { Routes, Route } from "react-router-dom";


// import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { permissionAuth } from "../contexts/permission";
import { Layout } from "../foms/Layout";
import { Nav } from "../foms/Nav";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import Patient from "../pages/Patient";
import User from "../pages/User";

export enum CONSTANTES_ROUTERS {
  HOME = "home",
  DASHBOARD = "dashboard",
  USER = "usuarios",
  PATIENT = "pacientes",
}
interface Props {
  path: string;
  componentRoute: any;
}

const OtherRoutes = () => {
  const { hasPermition } = permissionAuth();

  const routes: Props[] = [
    { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home },
    { path: CONSTANTES_ROUTERS.DASHBOARD, componentRoute: Dashboard },
    { path: CONSTANTES_ROUTERS.USER, componentRoute: User },
    { path: CONSTANTES_ROUTERS.PATIENT, componentRoute: Patient },
  ];

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
          {hasPermition(CONSTANTES_ROUTERS.USER) ? (
            <Route
              path={`/${CONSTANTES_ROUTERS.USER}`}
              element={
                // <AlertDialog.Root>
                  <Layout>
                    <User />
                  </Layout>
                // </AlertDialog.Root>
              }
            />
          ) : null}
          {hasPermition(CONSTANTES_ROUTERS.PATIENT) ? (
            <Route
              path={`/${CONSTANTES_ROUTERS.PATIENT}`}
              element={
                <Layout>
                  <Patient />
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
