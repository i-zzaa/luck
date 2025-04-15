import { diffWeek } from '../../util/util';

export function useModalidadeInfo(
  modalidade: string,
  dataInicio?: string,
  dataFim?: string,
  dataAtual?: string
): string {
  const isAvaliacao = modalidade === 'Avaliação';
  const hasValidDates = dataInicio && dataFim && dataAtual;

  if (!isAvaliacao || !hasValidDates) return modalidade;

  const semanaAtual = diffWeek(dataInicio, dataAtual);
  const totalSemanas = diffWeek(dataInicio, dataFim);

  return `${modalidade} ${semanaAtual}/${totalSemanas}`;
}
