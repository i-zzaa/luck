export interface ConfirmProps {
  title: string;
  message: string;
  icon?: string;
  open: boolean;
  onAccept?: () => void;
  onReject: () => void;
  onClose: () => void;
}
import { ConfirmDialog  } from 'primereact/confirmdialog';

export function Confirm({  title, message, icon, onAccept, onReject, open, onClose }: ConfirmProps) {
  return (
    <ConfirmDialog 
      visible={open} 
      onHide={onClose} 
      message={message}
      header={title}
      icon={icon}
      accept={onAccept} 
      reject={onReject} 
    />
  )
}