export interface ButtonProps {
  type?: 'primary' | 'second' | 'transparent';
  color?: 'white' | 'red' | 'green' | 'yellow' | 'violet';
  size?: 'full' | 'sm' | 'icon' | 'link' | 'md';
  icon?: string;
  text: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (event: any) => any;
  typeButton?: 'button' | 'submit' | 'reset';
}
