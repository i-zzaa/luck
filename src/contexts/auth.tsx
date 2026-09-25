import React, { createContext, useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { api, intercepttRoute } from '../server';
import { useToast } from './toast';
import { clearCache } from '../localStorage/sessionStorage';
import { registerMustChangePasswordListener } from '../util/mustChangePasswordBus';
import type {
  AuthUserProps,
  LoginCredentialsProps,
  LoginResponseProps,
} from '../types/user';

// setTimeout estoura acima de 2^31-1 ms (~24,8 dias) e dispara na hora. O
// token hoje dura 1h, mas o prazo vem do .env do backend — limita pra não
// derrubar a sessão imediatamente se alguém configurar um prazo longo.
const MAX_TIMEOUT_MS = 2_147_483_647;

interface AuthContextData {
  signed: boolean;
  // Em runtime é AuthUserProps | undefined, mas continua `any` pra fora:
  // telas (ex.: Schedule) acessam user.id sem checar undefined, porque só
  // renderizam com signed=true (routes/index.tsx). Tipar aqui quebraria
  // essas telas sem mudar comportamento nenhum.
  user: any;
  // perfil.codigo do login (ex.: 'terapeuta'); '' quando o backend não
  // reconhece o perfil cadastrado (codigo null).
  perfil: string;
  mustChangePassword: boolean;
  Login(credentials: LoginCredentialsProps): Promise<void>;
  Logout(): void;
  clearMustChangePassword(): void;
}

interface Props {
  children: JSX.Element;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: Props) => {

  const [user, setUser] = useState<AuthUserProps>();
  // Estado próprio (não apenas derivado de user.mustChangePassword): também
  // precisa poder ser forçado a true por um 403 vindo de qualquer chamada
  // da API já autenticada (ver mustChangePasswordBus), não só pelo login.
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const { renderToast } = useToast();
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Evita que um timer de uma sessão anterior (ex: login -> logout -> login
  // de novo, tudo na mesma aba) sobreviva e derrube a sessão nova antes da
  // hora. Sem isso, cada chamada a Login() empilhava um setTimeout próprio
  // e o mais antigo deles vencia primeiro.
  const clearSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearSessionTimer, []);

  // Login/Logout/value memoizados pelo mesmo motivo do renderToast em
  // toast.tsx: AuthProvider fica perto da raiz (App.tsx), então um value
  // recriado a cada render derrubava em cascata todo consumidor de
  // useAuth() — inclusive efeitos de busca que dependem dessas funções.
  // Logout vem primeiro porque Login referencia ela nas deps.
  const Logout = useCallback(async () => {
    clearSessionTimer();
    await clearCache();
    setUser(undefined);
    setMustChangePassword(false);

    try {
      await api.get('/logout');
    } catch (error: any) {
      // Nunca logar o erro do axios inteiro: error.config.headers carrega
      // o "Authorization: Bearer <token>" que o interceptor injeta em toda
      // requisição (ver server/index.ts) — cair no console do navegador
      // expõe o token em devtools, serviços de log de erro do browser, ou
      // print de tela num relatório de bug.
      console.log(error?.response?.status, error?.message);
    }
  }, [clearSessionTimer]);

  // Desloga sozinho quando passar o expiresAt devolvido pelo login (antes
  // era um teto fixo de ~2h13 contado no front, sem relação com o prazo
  // real do JWT, que hoje é 1h — dava 1h13 de telas quebrando com 401).
  // O 401 do servidor continua sendo a fonte da verdade; isso só evita
  // deixar o usuário navegando com um token que já sabemos estar vencido.
  const scheduleSessionEnd = useCallback(
    (expiresAt: string) => {
      clearSessionTimer();
      const remainingMs = new Date(expiresAt).getTime() - Date.now();
      sessionTimerRef.current = setTimeout(() => {
        Logout();
      }, Math.min(Math.max(remainingMs, 0), MAX_TIMEOUT_MS));
    },
    [clearSessionTimer, Logout]
  );

  useEffect(() => {
    const storagedToken = sessionStorage.getItem('token');
    const storagedUser = sessionStorage.getItem('auth');
    const storagedExpiresAt = sessionStorage.getItem('expiresAt');

    if (!storagedToken || !storagedUser || !storagedExpiresAt) return;

    // Recarregou a aba depois do token vencer: não restaura a sessão (toda
    // chamada daria 401), volta direto pro login.
    if (new Date(storagedExpiresAt).getTime() <= Date.now()) {
      clearCache();
      return;
    }

    const _user: AuthUserProps = JSON.parse(storagedUser);
    setUser(_user);
    setMustChangePassword(Boolean(_user.mustChangePassword));
    intercepttRoute(storagedToken, _user.login, _user.id);
    scheduleSessionEnd(storagedExpiresAt);
  }, []);

  // Registra este provider no barramento para que buildErrorToast (fora da
  // árvore React) consiga forçar a tela de troca de senha a partir de um
  // 403 recebido em qualquer requisição.
  useEffect(() => {
    registerMustChangePasswordListener(() => setMustChangePassword(true));
    return () => registerMustChangePasswordListener(null);
  }, []);

  const Login = useCallback(
    async (credentials: LoginCredentialsProps) => {
      try {
        const response = await api.post<LoginResponseProps>('/login', credentials);
        const { accessToken, expiresAt, user } = response.data;

        // As permissões (já expandidas pelo backend) seguem dentro de `auth`
        // e são lidas pelo PermissionProvider via useAuth().user — não há
        // mais chave 'perfil' separada: o código vem de user.perfil.codigo.
        sessionStorage.setItem('token', accessToken);
        sessionStorage.setItem('auth', JSON.stringify(user));
        sessionStorage.setItem('expiresAt', expiresAt);

        await intercepttRoute(accessToken, user.login, user.id);
        scheduleSessionEnd(expiresAt);

        setUser(user);
        // Sempre presente na resposta do login (nunca undefined) — se true,
        // o app não deve deixar o usuário passar da tela de troca de senha
        // obrigatória (ver MustChangePasswordModal).
        setMustChangePassword(Boolean(user.mustChangePassword));

        renderToast({
          type: 'success',
          title: ' ',
          message: 'Bem vindo!',
          open: true,
        });
      } catch (error) {
        // O erro sobe para a tela de login, que mostra o aviso no próprio
        // formulário (login/senha incorretos, sem conexão) em vez de um
        // toast que some.
        throw error;
      }
    },
    [scheduleSessionEnd, renderToast]
  );

  // Chamado após PUT /usuarios/reset-senha responder 200 (troca obrigatória
  // concluída). O backend já limpou a flag no banco — não é preciso logar
  // de novo nem re-buscar o usuário, só refletir isso localmente para
  // liberar a navegação.
  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
    setUser((prev) => {
      if (!prev) return prev;

      const updated = { ...prev, mustChangePassword: false };
      sessionStorage.setItem('auth', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      signed: Boolean(user),
      user,
      Login,
      Logout,
      perfil: user?.perfil.codigo ?? '',
      mustChangePassword,
      clearMustChangePassword,
    }),
    [user, Login, Logout, mustChangePassword, clearMustChangePassword]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
