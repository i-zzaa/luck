import { notifyMustChangePasswordRequired } from './mustChangePasswordBus';

const DEFAULT_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente.';

// Mensagem fixa que o backend devolve em qualquer rota com tag de permissão
// enquanto mustChangePassword estiver true para o usuário do token. O
// `codigo` desse 403 é o mesmo SEM_PERMISSAO de qualquer outra falta de
// permissão, então ainda é preciso olhar a mensagem. Casado por substring
// (case-insensitive) em vez de string exata pra não quebrar se o backend
// ajustar pontuação/sufixo.
const MUST_CHANGE_PASSWORD_MESSAGE_HINT = 'troca de senha obrigat';

// Envelope padronizado de erro do backend (heron-list-nest util/response.ts
// e AllExceptionsFilter, item 28 do pedido-frontend-fase2.md): toda resposta
// de erro vem com `codigo` estável (NAO_AUTENTICADO, SEM_PERMISSAO, ...) e
// `mensagem` legível.
interface ErrorEnvelope {
  codigo: string;
  mensagem: string;
}

const isMustChangePasswordError = (error: any): boolean => {
  const status = error?.response?.status;
  const mensagem = (error?.response?.data as ErrorEnvelope | undefined)
    ?.mensagem;

  return (
    status === 403 &&
    typeof mensagem === 'string' &&
    mensagem.toLowerCase().includes(MUST_CHANGE_PASSWORD_MESSAGE_HINT)
  );
};

export interface ErrorInfo {
  code: string;
  message: string;
}

// Extrai código e mensagem do envelope de erro do backend a partir de um
// erro do axios (error.response.data). Sem resposta do servidor (falha de
// rede, timeout) não há envelope — aí usa error.message do axios e, por
// último, o fallback, pra nunca deixar a mensagem em branco.
export const getErrorInfo = (
  error: any,
  fallbackMessage: string = DEFAULT_ERROR_MESSAGE
): ErrorInfo => {
  const data = error?.response?.data as ErrorEnvelope | undefined;

  return {
    code: data?.codigo ?? '',
    message: data?.mensagem || error?.message || fallbackMessage,
  };
};

// Monta diretamente o payload esperado por renderToast, já com o código de
// erro do backend como título e a mensagem do backend como corpo.
//
// Caso especial: se o erro for o 403 de troca de senha obrigatória pendente,
// não mostra o toast genérico de "sem permissão" — em vez disso, avisa o
// AuthProvider (via mustChangePasswordBus) para exibir a tela de troca de
// senha, que já deixa claro o motivo. O toast retornado fica com open:false
// para que os call sites (que sempre fazem `renderToast(buildErrorToast(...))`)
// não precisem de nenhuma mudança. Portado de heron-list-web.
export const buildErrorToast = (
  error: any,
  fallbackMessage?: string
): { type: 'failure'; title: string; message: string; open: boolean } => {
  const { code, message } = getErrorInfo(error, fallbackMessage);

  if (isMustChangePasswordError(error)) {
    notifyMustChangePasswordRequired();

    return {
      type: 'failure',
      title: code || 'Erro',
      message,
      open: false,
    };
  }

  return {
    type: 'failure',
    title: code || 'Erro',
    message,
    open: true,
  };
};
