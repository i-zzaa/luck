export interface ChoiceItemScheduleProps {
  start: string;
  end: string;
  title: string;
  statusEventos: string;
  localidade: string;
  // Descrição/endereço do local externo — só existe (e só é usada) quando
  // isExterno === true. Com isExterno === false, o local exibido é sempre
  // `localidade` (localidade.nome, resolvido pelo chamador).
  localExternoDescricao?: string;
  isExterno: boolean;
  km?: number;
  modalidade: string;
  dataInicio?: string;
  dataFim?: string;
  dataAtual?: string;
}
