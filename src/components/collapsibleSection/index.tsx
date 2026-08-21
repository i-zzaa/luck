import { useState } from 'react';
import clsx from 'clsx';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

// Componente de módulo (fora de qualquer render de página) de propósito:
// se isso fosse declarado dentro do componente da página, cada render do
// pai criaria um NOVO tipo de componente, e o React desmontaria/remontaria
// a seção a cada atualização de estado — perdendo o `open` toda vez que
// qualquer coisa na tela mudasse.
export function CollapsibleSection({
  title,
  count = 0,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 py-2 min-h-[44px]"
      >
        <span className="flex items-center gap-2 text-gray-800 font-inter font-bold">
          <i
            className={clsx(
              'pi text-xs',
              open ? 'pi-chevron-down' : 'pi-chevron-right'
            )}
          />
          {title}
        </span>
        {count > 0 && (
          <span className="text-xs font-inter font-semibold text-white bg-violet-800 rounded-full px-2 py-0.5 leading-4">
            {count} selecionado{count > 1 ? 's' : ''}
          </span>
        )}
      </button>
      {open && <div className="pl-1">{children}</div>}
    </div>
  );
}
