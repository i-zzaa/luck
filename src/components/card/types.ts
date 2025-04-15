import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  legend?: string;
  type?: string;
  className?: string;
  onClick?: () => void;
}
