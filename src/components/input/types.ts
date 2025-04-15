import { ReactNode } from 'react';

export interface InputProps {
  id: string;
  type: string;
  labelText: string;
  value?: any;
  options?: any;
  className?: string;
  customCol?: string;
  disabled?: boolean;
  onChange?: (value: any) => void;
  onClick?: (value: 'remove' | 'add') => void;
  validate?: any;
  errors?: any;
  hidden?: any;
  control?: any;
  buttonAdd?: boolean;
  children?: ReactNode;
}