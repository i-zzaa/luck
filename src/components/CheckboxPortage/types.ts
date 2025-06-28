import { VALOR_PORTAGE } from "../../constants/protocolo";

export interface CheckboxPortageProps {
  value: (typeof VALOR_PORTAGE)[keyof typeof VALOR_PORTAGE];
  onChange: (value: (typeof VALOR_PORTAGE)[keyof typeof VALOR_PORTAGE]) => void;
  disabled?: boolean;
}