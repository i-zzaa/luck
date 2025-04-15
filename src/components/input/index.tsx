import { InputProps } from './types';
import { InputWrapper } from './InputWrapper';
import { InputTextarea } from './inputs/InputTextarea';
import { InputDropdown } from './inputs/InputDropdown';
import { InputMultiSelect } from './inputs/InputMultiSelect';
import { InputAdd } from './inputs/InputAdd';
import { InputCheckbox } from './inputs/InputCheckbox';
import { InputSwitchField } from './inputs/InputSwitch';
import { InputTel } from './inputs/InputTel';
import { InputPrice } from './inputs/InputPrice';
import { InputDate } from './inputs/InputDate';
import { InputTime } from './inputs/InputTime';
import { InputText } from './inputs/InputText';
import { InputSelectAdd } from './inputs/InputSelectAdd';
import { InputPassword } from './inputs/InputPassword';

export function Input(props: InputProps) {
  const { type } = props;

  const renderByType = () => {
    switch (type) {
      case 'textarea':
        return <InputTextarea {...props} />;
      case 'select':
        return <InputDropdown {...props} />;
      case 'multiselect':
        return <InputMultiSelect {...props} />;
      case 'input-add':
        return <InputAdd {...props} />;
      case 'checkbox':
        return <InputCheckbox {...props} />;
      case 'switch':
        return <InputSwitchField {...props} />;
      case 'tel':
        return <InputTel {...props} />;
      case 'price':
        return <InputPrice {...props} />;
      case 'date':
        return <InputDate {...props} />;
      case 'time':
        return <InputTime {...props} />;
      case 'text':
        return <InputText {...props} />;
      case 'select-add':
        return <InputSelectAdd {...props} />;
      case 'password':
        return <InputPassword {...props} />;
      default:
        return <InputText {...props} />;
    }
  };

  return <InputWrapper {...props}>{renderByType()}</InputWrapper>;
}