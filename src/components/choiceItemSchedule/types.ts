export interface ChoiceItemScheduleProps {
  start: string;
  end: string;
  title: string;
  // Objeto inteiro (não só o nome) — a cor/categoria usa `codigo` (ver
  // util/status.ts) e o badge exibe `nome`.
  statusEventos?: { codigo?: string; nome?: string };
  // "Onde foi a sessão", já pronto do backend (ver ScheduleInfo.tsx).
  localExibicao?: string;
  // Texto da modalidade JÁ PRONTO pra exibir — passe
  // `item.modalidadeExibicao` de /evento/filtro (ex.: "Avaliação 2/4").
  // O componente não calcula mais a semana da avaliação (antes:
  // useModalidadeInfo + diffWeek) — item 8 de
  // heron-list-nest/docs/pedido-frontend-fase2.md.
  modalidade?: string;
}
