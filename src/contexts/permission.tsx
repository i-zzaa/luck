import { createContext, useContext } from "react";
import { useAuth } from "./auth";

interface PermissionContextData {
  hasPermition(rule: string): void | boolean;
  ROUTERS_PERMISSIONS: object;
  perfil: string | null;
}

interface Props {
  children: JSX.Element;
}

export const ADMINISTRADOR = "administrador";
export const ATENDENTE = "atendente";
export const DESENVOLVEDOR = "developer";
export const COORDENADOR = "coordenador";

const ROUTERS_PERMISSIONS: any = {
  home: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE, COORDENADOR],
  dashboard: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
  pacientes: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE, COORDENADOR],
  btnAgendar: [DESENVOLVEDOR, ADMINISTRADOR],
  btnDevolutiva: [COORDENADOR],
  btnRetornarAFila: [DESENVOLVEDOR, ATENDENTE],
  usuarios: [DESENVOLVEDOR, ADMINISTRADOR],
  login: "*",
};

// const ACTIONS_PERMISSIONS_PATIENTS_SCREEN: any = {
//   cadastrar: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
//   filtrar_inativos: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
//   desativar: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
//   editar: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
//   agendar: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
//   filtrar_agendadados: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
// }

const PermissionContext = createContext<PermissionContextData>(
  {} as PermissionContextData
);

export const PermissionProvider = ({ children }: Props) => {
  const { perfil } = useAuth();

  const hasPermition = (menu: string) => {
    switch (true) {
      case !perfil:
        throw new Error("Voce não tem permissao");
      case !Array.isArray(ROUTERS_PERMISSIONS[menu]):
        return true;
      default:
        if (ROUTERS_PERMISSIONS[menu].includes(perfil)) {
          return true;
        }
        return false;
    }
  };

  // const permissionDisabled = (menu: string) => {
  //   switch (true) {
  //     case perfil === COORDENADOR:
  //       return true;
  // }

  return (
    <PermissionContext.Provider
      value={{ hasPermition, ROUTERS_PERMISSIONS, perfil }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const permissionAuth = () => useContext(PermissionContext);
