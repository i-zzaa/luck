export interface UserProps {
  name: string;
  loggin: string;
  perfil: string;
  permissoes: string[];
}

export interface AuthProps {
  loggin: string;
  password: string;
}

export interface UserContextProps {
  isLoggedIn: boolean;
  user: UserProps;
  login(credentials: AuthProps): void;
  logout(): void;
}
