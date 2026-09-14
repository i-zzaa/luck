import { createContext, useContext, useCallback, useMemo } from 'react';
import { useAuth } from './auth';

interface PermissionContextData {
  hasPermition(rule: string): boolean;
  permissions: string[];
  perfil: string;
}

interface Props {
  children: JSX.Element;
}

// Casam com user.perfil.codigo devolvido pelo login (heron-list-nest
// auth.service, PERFIL_CODIGO). Só existem perfis que o backend conhece —
// 'coordenador-terapeuta' e 'financeiro' saíram por não terem código lá.
export const ADMINISTRADOR = 'administrador';
export const ATENDENTE = 'secretaria';
export const DESENVOLVEDOR = 'developer';
export const COORDENADOR = 'coordenadora';
export const TERAPEUTA = 'terapeuta';

const PermissionContext = createContext<PermissionContextData>(
  {} as PermissionContextData
);

export const PermissionProvider = ({ children }: Props) => {
  const { user, perfil } = useAuth();

  // Derivado direto do usuário logado (o AuthProvider já restaura `auth` do
  // sessionStorage no reload). Antes havia um setPermissionsLogin chamado
  // pelo AuthProvider, que fica FORA deste provider na árvore (App.tsx vs
  // routes/index.tsx) — o contexto chegava vazio lá e a chamada nunca
  // acontecia; só funcionava porque este provider relia o sessionStorage.
  const permissions = useMemo(() => user?.permissoes ?? [], [user]);

  // hasPermition/value memoizados pelo mesmo motivo do renderToast em
  // toast.tsx: PermissionProvider embrulha as rotas inteiras
  // (routes/index.tsx), então um value recriado a cada render derrubava em
  // cascata todo consumidor de permissionAuth().
  //
  // Sem bypass por perfil: o login já devolve as permissões expandidas
  // (Developer recebe todas as tags), então decidir é só consultar a lista.
  // Nunca lança — hasPermition é chamada no corpo do render por todo o app
  // e não há Error Boundary; negar some com o botão em vez de quebrar a tela.
  const hasPermition = useCallback(
    (rule: string = '') =>
      rule === '*' || permissions.includes(rule.toUpperCase()),
    [permissions]
  );

  const value = useMemo(
    () => ({ hasPermition, perfil, permissions }),
    [hasPermition, perfil, permissions]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const permissionAuth = () => useContext(PermissionContext);
