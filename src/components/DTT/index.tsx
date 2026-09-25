import { MultiStateCheckbox } from 'primereact/multistatecheckbox';
import { CheckboxDTTProps, DTTENUM } from './types';
import { IconC, IconDT, IconDP, IconDG, IconDV } from './icons';

// Controlado pelo `value` que vem da árvore, sem cópia em useState: as
// árvores da sessão são recarregadas (ex.: ao voltar do "Adicionar
// metas") e os slots são renderizados por posição, então o React reusa o
// mesmo componente. Com estado interno, a marcação continuava desenhada
// na tela depois de sumir do dado — a terapeuta via o treino preenchido,
// mas o que era enviado no salvar estava vazio.
export default function CheckboxDTT({ value, onChange, disabled }: CheckboxDTTProps) {
  const optionsCurrent = [
    { value: DTTENUM.c, icon: IconC },
    { value: DTTENUM.dt, icon: IconDT },
    { value: DTTENUM.dp, icon: IconDP },
    { value: DTTENUM.dg, icon: IconDG },
    { value: DTTENUM.dv, icon: IconDV },
  ];

  const iconTemplate = ({ option }: any) => option?.icon;

  return (
    <MultiStateCheckbox
      value={value ?? null}
      options={optionsCurrent}
      onChange={(e) => onChange(e.value)}
      optionLabel="value"
      optionValue="value"
      iconTemplate={iconTemplate}
      // className="w-6 h-6"
      disabled={disabled}
    />
  );
}