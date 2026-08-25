import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom não implementa medidas de layout de verdade (não tem motor de
// renderização) — Range.getClientRects/getBoundingClientRect voltam
// undefined, e o ProseMirror (usado pelo Tiptap, no RichTextEditor) chama
// isso pra rolar até a posição do cursor a cada edição, derrubando o
// teste com "target.getClientRects is not a function". Stub padrão
// documentado pelo próprio ecossistema Tiptap/ProseMirror pra teste.
const rectStub = () => ({
  x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0,
  toJSON: () => {},
});
document.createRange = () => {
  const range = new Range();
  range.getBoundingClientRect = rectStub as any;
  range.getClientRects = () => ({
    item: () => null,
    length: 0,
    [Symbol.iterator]: function* () {},
  }) as any;
  return range;
};
// mesmo motivo: jsdom não faz layout de verdade, então não tem como
// resolver "qual elemento está nessas coordenadas de tela" — ProseMirror
// chama isso a cada clique/toque dentro do editor pra achar a posição do
// cursor.
document.elementFromPoint = () => null;

// Sem test.globals:true no vitest.config.ts, o @testing-library/react não
// registra o cleanup automático sozinho — sem isso, o DOM de um teste
// fica de pé pro próximo dentro do mesmo arquivo (getByRole passa a achar
// elementos duplicados).
afterEach(() => {
  cleanup();
});
