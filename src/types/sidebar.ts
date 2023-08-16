export interface SidebarMenuProps {
  name: string;
  icon: any;
  path: string;
}

export interface SidebarProps {
  size: string;
}

export interface SidebarContext {
  open: boolean;
  setOpen(value: boolean): void;
}
