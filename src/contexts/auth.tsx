import React, { createContext, useState, useEffect, useContext } from "react";
import { api, intercepttRoute } from "../server";
import { permissionAuth } from "./permission";
import { useToast } from "./toast";

interface AuthContextData {
  signed: boolean;
  user: object | null;
  perfil: string | null; 
  Login(user: object): Promise<void>;
  Logout(): void;
}

interface Props {
  children: JSX.Element;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<object | null>(null);
  const [perfil, setPerfil] = useState<string | null>(null);
  const { setPermissionsLogin } = permissionAuth();
  const { renderToast } = useToast();

  useEffect(() => {
    const storagedToken = sessionStorage.getItem("token");
    const storagedUser = sessionStorage.getItem("auth");
    const storagedPerfil = sessionStorage.getItem("perfil");

    if (storagedToken && storagedUser) {
      const _user = JSON.parse(storagedUser);
      setUser(_user);
      setPerfil(storagedPerfil);
      intercepttRoute(storagedToken, _user.login);
    }
  }, []);

  const Login = async (loginState: object) => {
    try {
      const response = await api.post("/login", loginState);
      const auth = response.data;

      const user = auth?.user || auth.data;
      const accessToken = auth?.accessToken || auth.data.accessToken;

      const perfilName = user.perfil?.nome
        ? user.perfil.nome.toLowerCase()
        : user.perfil.toLowerCase();

      sessionStorage.setItem("token", accessToken);
      sessionStorage.setItem("auth", JSON.stringify(user));
      sessionStorage.setItem("perfil", perfilName);

      if(user.permissoes.length) setPermissionsLogin(user.permissoes)

      setPerfil(perfilName);
      setUser(user);
      await intercepttRoute(accessToken, user.login);
      renderToast({
        type: "success",
        title: " ",
        message: auth.message,
        open: true,
      });
    } catch ({ response }) {
      msgError(response);
    }
  };

  const msgError = (data: any) => {
    const message = data ? data?.message : "Usuário não encontrado!";
    renderToast({
      type: "failure",
      title: "401",
      message: message,
      open: true,
    });
  };

  const Logout = () => {
    setUser(null);
    sessionStorage.clear();
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
