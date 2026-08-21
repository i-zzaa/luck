import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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

  // hasPermition/setPermissionsLogin/value memoizados pelo mesmo motivo
  // do renderToast em toast.tsx: PermissionProvider embrulha as rotas
  // inteiras (routes/index.tsx), então um value recriado a cada render
  // derrubava em cascata todo consumidor de permissionAuth().
  const setPermissionsLogin = useCallback((permissionsList: string[]) => {
    setPermissions(permissionsList);
  }, []);

  // Antes: useMemo(async () => {...}, []) — o corpo async de um useMemo
  // roda na hora, durante o render (useMemo não serve pra side effect, só
  // pra memoizar um valor síncrono). Isso disparava GET /permissao a cada
  // render do provider, e o StrictMode do React 18 dobra exatamente esse
  // tipo de chamada em dev pra flagrar efeito colateral impuro no render.
  // O useEffect logo abaixo também era morto: "getPermissions;" só
  // referenciava a Promise, nunca a executava.
  useEffect(() => {
    if (permissions.length) return;

    const sessionUser = sessionStorage.getItem('auth');
    const user = sessionUser ? JSON.parse(sessionUser) : {};

    if (user.permissoes) {
      setPermissions(user.permissoes);
      return;
    }

    let ignore = false;
    getList('permissao').then((list) => {
      if (!ignore) setPermissions(list);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const hasPermition = useCallback(
    (rule: string = '') => {
      switch (true) {
        // Antes isso jogava um throw — hasPermition é chamada direto no
        // corpo do render em telas por todo o app (Filter, itemList,
        // etc.), e como o projeto não tem nenhum Error Boundary, esse
        // throw derrubava a aplicação inteira pra tela em branco sempre
        // que algo renderizasse antes de `perfil` estar populado. Negar o
        // acesso é o resultado seguro — some com o botão/campo em vez de
        // quebrar a página.
        case !perfil:
          return false;
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
    },
    [perfil, permissions]
  );

  const value = useMemo(
    () => ({ hasPermition, perfil, permissions, setPermissionsLogin }),
    [hasPermition, perfil, permissions, setPermissionsLogin]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const permissionAuth = () => useContext(PermissionContext);
