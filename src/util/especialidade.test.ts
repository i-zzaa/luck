import { describe, expect, it } from 'vitest';
import { resolveEspecialidadeCodigo } from './especialidade';

describe('resolveEspecialidadeCodigo', () => {
  it('reconhece a sigla exata (qualquer caixa)', () => {
    expect(resolveEspecialidadeCodigo('TO')).toBe('TO');
    expect(resolveEspecialidadeCodigo('fono')).toBe('FONO');
    expect(resolveEspecialidadeCodigo('Psico')).toBe('PSICO');
  });

  it('resolve por nome completo via substring', () => {
    expect(resolveEspecialidadeCodigo('Terapia Ocupacional')).toBe('TO');
    expect(resolveEspecialidadeCodigo('Fonoaudiologia')).toBe('FONO');
    expect(resolveEspecialidadeCodigo('Musicoterapia')).toBe('MUSICOTERAPIA');
  });

  it('desambigua PSICOPEDAG e MOTRICIDADE antes de cair em PSICO (bug histórico)', () => {
    // "psicopedagogia" e "psicomotricidade" contêm "psico" como
    // substring — sem a ordem certa de checagem, os dois cairiam
    // incorretamente em PSICO.
    expect(resolveEspecialidadeCodigo('Psicopedagogia')).toBe('PSICOPEDAG');
    expect(resolveEspecialidadeCodigo('Psicomotricidade')).toBe('MOTRICIDADE');
    expect(resolveEspecialidadeCodigo('Psicologia')).toBe('PSICO');
  });

  it('ignora acentuação', () => {
    expect(resolveEspecialidadeCodigo('Psicopedagogía')).toBe('PSICOPEDAG');
  });

  it('aceita objeto com campo codigo (prioridade) ou nome', () => {
    expect(resolveEspecialidadeCodigo({ codigo: 'TO', nome: 'Terapia Ocupacional' })).toBe('TO');
    expect(resolveEspecialidadeCodigo({ nome: 'Fonoaudiologia' })).toBe('FONO');
  });

  it('retorna null pra entrada vazia/desconhecida', () => {
    expect(resolveEspecialidadeCodigo('')).toBeNull();
    expect(resolveEspecialidadeCodigo(undefined)).toBeNull();
    expect(resolveEspecialidadeCodigo(null)).toBeNull();
    expect(resolveEspecialidadeCodigo('Especialidade Desconhecida')).toBeNull();
  });
});
