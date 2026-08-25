import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from './index';

describe('RichTextEditor — contador de caracteres', () => {
  it('não mostra contador quando minLength não é passado', () => {
    render(<RichTextEditor value="" onBlur={vi.fn()} />);
    expect(screen.queryByText(/caracteres/)).not.toBeInTheDocument();
  });

  it('mostra "0 / N caracteres" em vermelho ao montar vazio, com minLength', async () => {
    render(<RichTextEditor value="" onBlur={vi.fn()} minLength={200} />);
    await waitFor(() =>
      expect(screen.getByText(/0 \/ 200 caracteres/)).toBeInTheDocument()
    );
  });

  it('atualiza o contador ao digitar, abaixo do mínimo', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor value="" onBlur={vi.fn()} minLength={200} />);

    const editable = document.querySelector('[contenteditable="true"]') as HTMLElement;
    await user.click(editable);
    await user.type(editable, 'Sessão tranquila');

    await waitFor(() =>
      expect(screen.getByText(/16 \/ 200 caracteres/)).toBeInTheDocument()
    );
  });

  it('troca pra "N caracteres" com check ao atingir o mínimo', async () => {
    const user = userEvent.setup();
    const texto = 'x'.repeat(200);
    render(<RichTextEditor value="" onBlur={vi.fn()} minLength={200} />);

    const editable = document.querySelector('[contenteditable="true"]') as HTMLElement;
    await user.click(editable);
    await user.type(editable, texto, { delay: null });

    await waitFor(() =>
      expect(screen.getByText(/200 caracteres/)).toBeInTheDocument()
    );
    expect(screen.queryByText(/\/ 200 caracteres \(mínimo/)).not.toBeInTheDocument();
  });

  it('readOnly nunca mostra o contador, mesmo com minLength', () => {
    render(
      <RichTextEditor value="<p>algo</p>" onBlur={vi.fn()} minLength={200} readOnly />
    );
    expect(screen.queryByText(/caracteres/)).not.toBeInTheDocument();
  });
});
