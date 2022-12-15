import { createContext, useContext, useEffect, useState } from "react";
import { getList } from "../server";
import { useAuth } from "./auth";

interface PermissionContextData {
  hasPermition(rule: string): void | boolean;
  permissions: string[];
  perfil: string | null;
}

interface Props {
  children: JSX.Element;
}

export const ADMINISTRADOR = "administrador";
export const ATENDENTE = "secretaria";
export const DESENVOLVEDOR = "developer";
export const COORDENADOR = "coordenador";
export const COORDENADOR_TERAPEUTA = "coordenador-terapeuta";
export const TERAPEUTA = "terapeuta";

const ROUTERS_PERMISSIONS: any = {
  home: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE, COORDENADOR, COORDENADOR_TERAPEUTA, TERAPEUTA],
  dashboard: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
  fila: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE, COORDENADOR],
  cadastro: [DESENVOLVEDOR, ADMINISTRADOR],
  agenda: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE, COORDENADOR, COORDENADOR_TERAPEUTA, TERAPEUTA],

  tab_avaliacao: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE, COORDENADOR,COORDENADOR_TERAPEUTA],
  tab_terapia: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],

  btnAgendar: [DESENVOLVEDOR, ADMINISTRADOR],
  btnDevolutiva: [COORDENADOR],
  btnsAction: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
  btnRetornarAFila: [DESENVOLVEDOR, ATENDENTE],

  textTelefone: [DESENVOLVEDOR, ADMINISTRADOR, ATENDENTE],
  login: "*",
};

const PermissionContext = createContext<PermissionContextData>(
  {} as PermissionContextData
);

export const PermissionProvider = ({ children }: Props) => {
  const { perfil } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(()=> {
    getList('permissao').then((roles: string[])=> {
      setPermissions(roles)
    })
  }, [permissions])

  const hasPermition = (role: string) => {
    const rule = role || ''

    switch (true) {
      case !perfil:
        throw new Error("Voce não tem permissao");
      case role === '*':
        return true;
      default:
        if (permissions.length && permissions.includes(rule.toUpperCase()) || perfil === DESENVOLVEDOR) {
          return true;
        }
        return false;
    }
  };

  return (
    <PermissionContext.Provider
      value={{ hasPermition, perfil, permissions }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const permissionAuth = () => useContext(PermissionContext);
