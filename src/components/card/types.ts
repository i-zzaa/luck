import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  type?: string;
  className?: string;
  onClick?: () => void;
}
