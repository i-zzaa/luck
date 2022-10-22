export interface ModalProps {
  children: ReactNode;
  title: string;
  open: boolean;
  onClose: () => void;
}
import { Dialog } from 'primereact/dialog';
import { ReactNode } from 'react';

export function Modal({  title, children, open, onClose}: ModalProps) {
  return (
    <Dialog header={title} modal visible={open} onHide={onClose} breakpoints={{'960px': '75vw'}} style={{width: '50vw'}}>
      { children }
    </Dialog>
  )
}