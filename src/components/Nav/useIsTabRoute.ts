import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { ROUTES } from '../../routes/OtherRoutes';

// true quando a rota atual é uma das 5 rotas "de topo" (menu: true) —
// é nelas que a tabbar flutuante aparece. Nas rotas de detalhe/edição
// (Sessão, DTT, Metas, Cadastro de PEI) ela fica escondida, do mesmo
// jeito que apps com tab bar nativa escondem a barra ao empilhar uma
// tela — aqui não tem pilha de fato (react-router troca a rota inteira),
// mas o efeito visual é o mesmo: tab bar só nas telas-raiz de cada seção.
//
// Mesma lógica de match de usePageTitle.ts: route.path nunca tem barra
// inicial, então compara com "/" + path, delimitando por fim-de-segmento
// pra "/pei" não bater também em "/pei-cadastro".
export function useIsTabRoute(): boolean {
  const { pathname } = useLocation();

  return useMemo(() => {
    // Depois do login, signed vira true e a árvore troca de PublicRoutes
    // pra OtherRoutes — não existe nenhum navigate() explícito nesse
    // meio-tempo, então a URL continua sendo "/" (onde ficava a tela de
    // login). "/" cai no fallback path:'*' das ROUTES, que renderiza
    // Home — mas "/" nunca bate com "/home" na comparação abaixo, então
    // sem esse caso especial a tab bar (e o título, ver usePageTitle.ts)
    // ficavam invisíveis bem na tela que o usuário mais vê: a primeira
    // depois de entrar.
    if (pathname === '/') return true;

    return ROUTES.some((route) => {
      if (!route.menu) return false;
      const routePath = `/${route.path}`;
      return pathname === routePath || pathname.startsWith(`${routePath}/`);
    });
  }, [pathname]);
}
