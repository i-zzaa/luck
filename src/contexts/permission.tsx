import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getList } from '../server';
import { useAuth } from './auth';

interface PermissionContextData {
  hasPermition(rule: string): void | boolean;
  setPermissionsLogin: (rules: string[]) => void;
  permissions: string[];
  perfil: string | null;
}

interface Props {
  children: JSX.Element;
}

export const ADMINISTRADOR = 'administrador';
export const ATENDENTE = 'secretaria';
export const DESENVOLVEDOR = 'developer';
export const COORDENADOR = 'coordenador';
export const COORDENADOR_TERAPEUTA = 'coordenador-terapeuta';
export const TERAPEUTA = 'terapeuta';
export const FINANCEIRO = 'financeiro';

const PermissionContext = createContext<PermissionContextData>(
  {} as PermissionContextData
);

export const PermissionProvider = ({ children }: Props) => {
  const { perfil } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);

  const setPermissionsLogin = (permissionsList: string[]) => {
    setPermissions(permissionsList);
  };

  const getPermissions = useMemo(async () => {
    const sessionUser = sessionStorage.getItem('auth');
    const user = sessionUser ? JSON.parse(sessionUser) : [];

    const list =  user.permissoes || await getList('permissao');
    setPermissions(list);
  }, []);

  useEffect(() => {
    if (!permissions.length) {
      getPermissions;
    }
  }, []);

  const hasPermition = (rule: string = '') => {
    switch (true) {
      case !perfil:
        throw new Error('Voce não tem permissao');
      case rule === '*':
        return true;
      default:
        if (
          (permissions.length && permissions.includes(rule.toUpperCase())) ||
          perfil === DESENVOLVEDOR
        ) {
          return true;
        }
        return false;
    }
  };

  return (
    <PermissionContext.Provider
      value={{ hasPermition, perfil, permissions, setPermissionsLogin }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const permissionAuth = () => useContext(PermissionContext);
