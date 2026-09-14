// Contrato único do POST /login (heron-list-nest auth.service, item 24 do
// pedido-frontend-fase2.md). Antes o front aceitava o usuário em `user` ou
// `data`, o token em dois lugares e `perfil` como objeto ou string — o
// backend agora devolve sempre esta forma, então o front só lê.

export interface PerfilProps {
  id: number;
  nome: string;
  // Código estável derivado pelo backend (developer, administrador,
  // coordenadora, secretaria, terapeuta). Vem null quando o nome do perfil
  // cadastrado não corresponde a nenhum desses.
  codigo: string | null;
}

export interface AuthUserProps {
  id: number;
  nome: string;
  login: string;
  perfil: PerfilProps;
  // Já expandidas pelo backend (Developer recebe todas as tags) — o front
  // não tem caso especial por perfil.
  permissoes: string[];
  mustChangePassword: boolean;
}

export interface LoginResponseProps {
  accessToken: string;
  // ISO 8601 — mesmo prazo usado para assinar o JWT.
  expiresAt: string;
  user: AuthUserProps;
}

export interface LoginCredentialsProps {
  username: string;
  password: string;
}
