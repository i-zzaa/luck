export interface ChoiceItemScheduleProps {
  start: string;
  end: string;
  title: string;
  // Objeto inteiro (não só o nome) — a classificação de cor/categoria
  // prefere `codigo` quando o backend mandar (ver util/status.ts) e só
  // cai pro matching por texto de `nome` como fallback.
  statusEventos?: { codigo?: string; nome?: string };
  localidade: string;
  // Descrição/endereço do local externo — só existe (e só é usada) quando
  // isExterno === true. Com isExterno === false, o local exibido é sempre
  // `localidade` (localidade.nome, resolvido pelo chamador).
  localExternoDescricao?: string;
  // FALLBACK TEMPORÁRIO: string já pronta pro "onde", preferida quando o
  // backend mandar (ver ScheduleInfo.tsx e docs/pedido-backend-formatacao.md).
  localExibicao?: string;
  isExterno: boolean;
  km?: number;
  modalidade: string;
  dataInicio?: string;
  dataFim?: string;
  dataAtual?: string;
}
