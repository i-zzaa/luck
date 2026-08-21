import React, { createContext, useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { api, intercepttRoute } from '../server';
import { permissionAuth } from './permission';
import { useToast } from './toast';
import { clearCache } from '../localStorage/sessionStorage';
import { buildErrorToast } from '../util/error';
import { registerMustChangePasswordListener } from '../util/mustChangePasswordBus';

// Duração fixa da sessão antes do logout automático (~2h13min). Não é
// inatividade real (não há listeners de atividade do usuário aqui) — é só
// um teto de tempo desde o login. Nomeado e centralizado pra não repetir o
// mesmo "8000000" mágico em outro lugar.
const SESSION_DURATION_MS = 8_000_000;

interface AuthContextData {
  signed: boolean;
  user: any;
  perfil: string ;
  mustChangePassword: boolean;
  Login(user: object): Promise<void>;
  Logout(): void;
  clearMustChangePassword(): void;
}

interface Props {
  children: JSX.Element;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: Props) => {

  const [user, setUser] = useState();
  const [perfil, setPerfil] = useState<string>('');
  // Estado próprio (não apenas derivado de user.mustChangePassword): também
  // precisa poder ser forçado a true por um 403 vindo de qualquer chamada
  // da API já autenticada (ver mustChangePasswordBus), não só pelo login.
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const { setPermissionsLogin } = permissionAuth();
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

  useEffect(() => {
    const storagedToken = sessionStorage.getItem('token');
    const storagedUser = sessionStorage.getItem('auth');
    const storagedPerfil = sessionStorage.getItem('perfil') ||  '';

    if (storagedToken && storagedUser) {
      const _user = JSON.parse(storagedUser);
      setUser(_user);
      setPerfil(storagedPerfil);
      setMustChangePassword(Boolean(_user.mustChangePassword));
      intercepttRoute(storagedToken, _user.login, _user.id);
    }
  }, []);

  // Registra este provider no barramento para que buildErrorToast (fora da
  // árvore React) consiga forçar a tela de troca de senha a partir de um
  // 403 recebido em qualquer requisição.
  useEffect(() => {
    registerMustChangePasswordListener(() => setMustChangePassword(true));
    return () => registerMustChangePasswordListener(null);
  }, []);

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

  const Login = useCallback(
    async (loginState: { username: string, password: string}) => {
      try {
        const response = await api.post('/login', loginState);

        const auth = response.data;

        clearSessionTimer();
        sessionTimerRef.current = setTimeout(() => {
          Logout();
        }, SESSION_DURATION_MS);

        const user = auth?.user || auth.data;
        const accessToken = auth?.accessToken || auth.data.accessToken;

        const perfilName = user.perfil?.nome
          ? user.perfil.nome.toLowerCase()
          : user.perfil.toLowerCase();

        sessionStorage.setItem('token', accessToken);
        sessionStorage.setItem('auth', JSON.stringify(user));
        sessionStorage.setItem('perfil', perfilName);

        if (user.permissoes.length && setPermissionsLogin)
          setPermissionsLogin(user.permissoes);

        setPerfil(perfilName);
        setUser(user);
        // Sempre presente na resposta do login (nunca undefined) — se true,
        // o app não deve deixar o usuário passar da tela de troca de senha
        // obrigatória (ver MustChangePasswordModal).
        setMustChangePassword(Boolean(user.mustChangePassword));

        await intercepttRoute(accessToken, user.login, user.id);

        renderToast({
          type: 'success',
          title: ' ',
          message: 'Bem vindo!',
          open: true,
        });
      } catch (error) {
        // getErrorInfo/buildErrorToast lê error.response.{status,data} (forma
        // real de um erro do axios) — o msgError anterior lia error.data e
        // error.status, que não existem nesse objeto, então sempre caía no
        // fallback genérico e escondia a mensagem real do backend.
        renderToast(buildErrorToast(error, 'Usuário não encontrado!'));
      }
    },
    [clearSessionTimer, Logout, setPermissionsLogin, renderToast]
  );

  // Chamado após PUT /usuarios/reset-senha responder 200 (troca obrigatória
  // concluída). O backend já limpou a flag no banco — não é preciso logar
  // de novo nem re-buscar o usuário, só refletir isso localmente para
  // liberar a navegação.
  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
    setUser((prev: any) => {
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
      perfil,
      mustChangePassword,
      clearMustChangePassword,
    }),
    [user, Login, Logout, perfil, mustChangePassword, clearMustChangePassword]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
