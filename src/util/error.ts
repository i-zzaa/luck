const DEFAULT_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente.';

export interface ErrorInfo {
  code: string;
  message: string;
}

// Extrai código e mensagem de erro vindos do backend a partir de um erro do
// axios (error.response.data / error.response.status). Cobre também erros
// sem resposta do servidor (falha de rede) usando error.message como
// fallback, e nunca deixa a mensagem em branco.
export const getErrorInfo = (
  error: any,
  fallbackMessage: string = DEFAULT_ERROR_MESSAGE
): ErrorInfo => {
  const response = error?.response;
  const data = response?.data;

  const backendMessage =
    (typeof data === 'string' ? data : undefined) ||
    data?.message ||
    data?.mensagem ||
    data?.error ||
    data?.erro ||
    (typeof data?.data === 'string' ? data.data : undefined);

  const message = backendMessage || error?.message || fallbackMessage;

  const code =
    data?.codigo ?? data?.code ?? data?.errorCode ?? response?.status ?? '';

  return {
    code: code === undefined || code === null ? '' : String(code),
    message,
  };
};

// Monta diretamente o payload esperado por renderToast, já com o código de
// erro do backend como título e a mensagem do backend como corpo.
//
// Versão simplificada da equivalente em heron-list-web: aqui não existe o
// caso especial de 403 "troca de senha obrigatória" (esse fluxo não foi
// portado para o luck — ver relatório de port do login, opção A).
export const buildErrorToast = (
  error: any,
  fallbackMessage?: string
): { type: 'failure'; title: string; message: string; open: boolean } => {
  const { code, message } = getErrorInfo(error, fallbackMessage);

  return {
    type: 'failure',
    title: code || 'Erro',
    message,
    open: true,
  };
};
