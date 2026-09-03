// Fonte única da "reserva" de espaço da tab bar flutuante — usada tanto
// pela própria BottomTabBar (posição/altura) quanto por qualquer botão
// fixo no rodapé (ex: "Salvar" em Portage/VBMapp/Cadastro de PEI) que
// precisa subir pra não ficar embaixo dela quando as duas coexistem na
// mesma tela.
//
// Referência: components/TabBar.tsx do projeto desafiaê — o wrapper de
// lá só tem paddingBottom = insets.bottom || spacing.md (12px), sem
// nenhuma folga adicional por cima disso. Ou seja: a pill fica no fim da
// tela mesmo, só recuada pela área segura do aparelho (notch/home
// indicator) quando ela existir — não "flutua" acima da borda com uma
// margem decorativa. max() reproduz esse "ou" em CSS puro: usa os 12px
// só quando a área segura for menor que isso (a maioria dos Android),
// e a área segura quando ela for maior (iPhones com home indicator).
export const BOTTOM_TAB_BAR_OFFSET = 'bottom-[max(0.75rem,env(safe-area-inset-bottom))]';
export const BOTTOM_TAB_BAR_HEIGHT = 'h-[4.5rem]'; // 72px, igual sizes.tabBarHeight de lá

// offset mínimo (0,75rem) + altura (4,5rem) + uma folga pequena = topo da
// tab bar. Usado pelos footers fixos que precisam ficar ACIMA da tab bar
// quando ela está visível na mesma tela (ver useIsTabRoute). Soma
// direto com a área segura em vez de max() aqui: é aceitável sobrar um
// pouco mais de espaço em telas com notch grande, o que importa é nunca
// sobrepor a tab bar.
export const ABOVE_TAB_BAR = 'bottom-[calc(5.25rem+env(safe-area-inset-bottom))]';
