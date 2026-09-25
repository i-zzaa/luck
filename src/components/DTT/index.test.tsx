import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckboxDTT from './index';
import { DTTENUM } from './types';

// O slot desenhado tem que ser sempre o do dado. As árvores da sessão
// são recarregadas (ao voltar do "Adicionar metas") e os slots são
// renderizados por posição: quando o componente guardava o valor em
// estado próprio, a marcação continuava na tela depois de sumir do dado,
// e o que ia no salvar estava vazio.
const marcados = (container: HTMLElement) =>
  container.querySelectorAll('.p-multistatecheckbox svg').length;

describe('CheckboxDTT', () => {
  it('desenha vazio quando o valor é nulo', () => {
    const { container } = render(<CheckboxDTT value={null} onChange={() => {}} />);
    expect(marcados(container)).toBe(0);
  });

  it('acompanha o valor que vem de fora, inclusive ao ser limpo', () => {
    const { container, rerender } = render(
      <CheckboxDTT value={DTTENUM.c} onChange={() => {}} />
    );
    expect(marcados(container)).toBe(1);

    rerender(<CheckboxDTT value={null} onChange={() => {}} />);
    expect(marcados(container)).toBe(0);
  });

  it('avisa quem controla o estado ao clicar, sem decidir sozinho', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<CheckboxDTT value={null} onChange={onChange} />);

    await user.click(container.querySelector('.p-multistatecheckbox')!);

    expect(onChange).toHaveBeenCalledWith(DTTENUM.c);
    // Sem o pai atualizar o `value`, a tela continua vazia — é o pai que
    // guarda a resposta que será salva.
    expect(marcados(container)).toBe(0);
  });
});
