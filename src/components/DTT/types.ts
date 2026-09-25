export enum DTTENUM {
  c = 'C',
  dt = 'DT',
  dp = 'DP',
  dg = 'DG',
  dv = 'DV'
}

export interface CheckboxDTTProps {
  // Slot ainda não treinado é null — é assim que a árvore da sessão
  // guarda a tentativa vazia (ver util/sessionTree.ts).
  value: DTTENUM | null;
  onChange: (value: DTTENUM | null) => void;
  disabled?: boolean;
}

