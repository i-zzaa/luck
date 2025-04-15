import { Button } from 'primereact';
import { ButtonProps } from './types';
import { useButtonStyles } from './useButtonStyles';

export function ButtonHeron({
  icon,
  size = 'full',
  type = 'primary',
  color = 'white',
  text,
  loading,
  disabled = false,
  onClick,
  typeButton = 'submit',
}: ButtonProps) {
  const isIconOnly = size === 'icon';
  const buttonClass = useButtonStyles(type, color, size);

  return (
    <Button
      icon={icon}
      type={typeButton}
      label={isIconOnly ? '' : text}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      className={buttonClass}
    />
  );
}
