import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { api, intercepttRoute } from '../server';
import { permissionAuth } from './permission';
import { useToast } from './toast';
import { clearCache } from '../localStorage/sessionStorage';
import { buildErrorToast } from '../util/error';

// Duração fixa da sessão antes do logout automático (~2h13min). Não é
// inatividade real (não há listeners de atividade do usuário aqui) — é só
// um teto de tempo desde o login. Nomeado e centralizado pra não repetir o
// mesmo "8000000" mágico em outro lugar.
const SESSION_DURATION_MS = 8_000_000;

interface AuthContextData {
  signed: boolean;
  user: any;
  perfil: string ;
  Login(user: object): Promise<void>;
  Logout(): void;
}

interface Props {
  children: JSX.Element;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: Props) => {

  const [user, setUser] = useState();
  const [perfil, setPerfil] = useState<string>('');
  const { setPermissionsLogin } = permissionAuth();
  const { renderToast } = useToast();
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Evita que um timer de uma sessão anterior (ex: login -> logout -> login
  // de novo, tudo na mesma aba) sobreviva e derrube a sessão nova antes da
  // hora. Sem isso, cada chamada a Login() empilhava um setTimeout próprio
  // e o mais antigo deles vencia primeiro.
  const clearSessionTimer = () => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  useEffect(() => clearSessionTimer, []);

  useEffect(() => {
    const storagedToken = sessionStorage.getItem('token');
    const storagedUser = sessionStorage.getItem('auth');
    const storagedPerfil = sessionStorage.getItem('perfil') ||  '';

    if (storagedToken && storagedUser) {
      const _user = JSON.parse(storagedUser);
      setUser(_user);
      setPerfil(storagedPerfil);
      intercepttRoute(storagedToken, _user.login, _user.id);
    }
  }, []);

  const Login = async (loginState: { username: string, password: string}) => {
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
  };

  const Logout = async () => {
    clearSessionTimer();
    await clearCache();
    setUser(undefined);

    try {
      await api.get('/logout');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ signed: Boolean(user), user, Login, Logout, perfil }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
