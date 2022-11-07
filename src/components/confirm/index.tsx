export interface ConfirmProps {
  title: string;
  message: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  open: boolean;
  onAccept?: () => void;
  onReject: () => void;
  onClose: () => void;
}
import { ConfirmDialog  } from 'primereact/confirmdialog';

export function Confirm({  
  title, 
  message, 
  icon, 
  onAccept, 
  onReject, 
  open, 
  onClose, 
  rejectLabel="Não", 
  acceptLabel ="Sim"
}: ConfirmProps) {
  return (
    <ConfirmDialog 
      visible={open} 
      onHide={onClose} 
      message={message}
      header={title}
      icon={icon}
      accept={onAccept} 
      reject={onReject} 
      acceptLabel={acceptLabel}
      rejectLabel={rejectLabel}
    />
  )
}