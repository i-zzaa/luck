import { MultiStateCheckbox } from 'primereact/multistatecheckbox';
import { IconSim, IconAsVezes, IconNao } from './icons';
import { VALOR_PORTAGE } from '../../constants/protocolo';
import { CheckboxPortageProps } from './types';

const optionsCurrent = [
  { value: VALOR_PORTAGE.sim, icon: IconSim },
  { value: VALOR_PORTAGE.asVezes, icon: IconAsVezes },
  { value: VALOR_PORTAGE.nao, icon: IconNao },
];

const iconTemplate = ({ option }: any) => option?.icon;

// Componente controlado de propósito: nada de estado próprio aqui. Antes
// tinha um useState(value) que só lia a prop no mount — depois disso o
// checkbox vivia da cópia local e nunca mais via mudanças reais de
// `value`. Junto com chaves instáveis nas listas (Portage.tsx/VBMapp.tsx
// reaproveitavam a instância errada entre linhas), o efeito era clicar
// num item "de cima" e o valor mudar no último item editado — a
// instância reaproveitada carregava o estado (e o clique) de outra
// linha. Sem estado local, o checkbox sempre reflete exatamente o que o
// pai (list) diz que é, então não tem como dessincronizar.
export default function CheckboxPortage({ value, onChange, disabled }: CheckboxPortageProps) {
  return (
    <MultiStateCheckbox
      value={value}
      options={optionsCurrent}
      onChange={(e) => onChange(e.value)}
      optionLabel="value"
      optionValue="value"
      iconTemplate={iconTemplate}
      className="w-8 h-8"
      disabled={disabled}
    />
  );
}
