import clsx from 'clsx';
import { useIsTabRoute } from '../Nav/useIsTabRoute';

interface Props {
  children: JSX.Element;
}

export const LayoutDefault = ({ children }: Props) => {
  // Esse `overflow-y-auto` (não o `main` em OtherRoutes.tsx, que não
  // tem altura/overflow próprios) é o scroll de verdade de cada tela —
  // por isso a reserva de espaço pra tab bar flutuante do rodapé
  // precisa estar aqui dentro, não só no `main` (onde já existia um
  // `pb-24` condicional que nunca chegava a fazer efeito nenhum, já
  // que quem rola é este container). Sem isso, o último item de telas
  // sem padding-bottom próprio (ex.: Primeira Resposta) ficava colado —
  // ou parcialmente escondido — atrás da tab bar.
  //
  // Padding (não margin): margem final dentro de um container com
  // overflow não entra na área rolável no Safari. E soma a área segura
  // (home indicator), que o `mb-24` fixo ignorava. Valor = topo da pill
  // (ABOVE_TAB_BAR em Nav/bottomTabBarLayout.ts) + 1rem de folga.
  const isTabRoute = useIsTabRoute();

  return (
    // overflow-x-hidden: nenhuma tela rola na horizontal — conteúdo largo
    // (tabelas etc.) precisa se ajustar à largura, não empurrar a página.
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div
        className={clsx(
          'mx-2 pt-4',
          isTabRoute
            ? 'pb-[calc(5.25rem+1rem+env(safe-area-inset-bottom))]'
            : 'pb-[calc(4rem+env(safe-area-inset-bottom))]'
        )}
      >
        {children}
      </div>
    </div>
  );
};
