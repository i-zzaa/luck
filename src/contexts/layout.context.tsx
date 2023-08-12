import { createContext, useState } from 'react';
import { SidebarContext } from '../types/sidebar';

export const LayoutContext = createContext({} as SidebarContext);

const LayoutProvider = ({ children }: any) => {
  const [open, setOpen] = useState(false)

    return (
      <LayoutContext.Provider value={{open, setOpen }}>
        {children}
      </LayoutContext.Provider>
    )
}

export default LayoutProvider;

