export enum DTTENUM {
  c = 'C',
  dt = 'DT',
  dp = 'DP',
  dg = 'DG',
  dv = 'DV'
}

export interface CheckboxDTTProps {
  value: DTTENUM.c | DTTENUM.dt | DTTENUM.dp | DTTENUM.dg | DTTENUM.dv;
  onChange: (value: CheckboxDTTProps['value']) => void;
  disabled?: boolean;
}

