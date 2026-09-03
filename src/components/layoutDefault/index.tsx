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
  const isTabRoute = useIsTabRoute();

  return (
    <div className="h-screen overflow-y-auto">
      <div className={clsx('mx-2 mt-4', isTabRoute ? 'mb-24' : 'mb-16')}>
        {children}
      </div>
    </div>
  );
};
