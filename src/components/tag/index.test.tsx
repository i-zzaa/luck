import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag } from './index';

describe('Tag', () => {
  it('exibe a sigla resolvida quando a especialidade é reconhecida', () => {
    render(<Tag type="Terapia Ocupacional" disabled={false} />);
    expect(screen.getByRole('button', { name: 'TO' })).toBeInTheDocument();
  });

  it('exibe o texto original em maiúsculas quando não reconhece a especialidade', () => {
    render(<Tag type="outraCoisa" disabled={false} />);
    expect(screen.getByRole('button', { name: 'OUTRACOISA' })).toBeInTheDocument();
  });

  it('fica desabilitado quando disabled=true', () => {
    render(<Tag type="TO" disabled />);
    expect(screen.getByRole('button', { name: 'TO' })).toBeDisabled();
  });

  it('chama onClick ao clicar', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Tag type="FONO" disabled={false} onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'FONO' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
