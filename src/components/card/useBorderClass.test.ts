import { describe, expect, it } from 'vitest';
import { useBorderColorClass } from './useBorderClass';

// Apesar do prefixo "use" (convenção de nome herdada do código
// original), essa função não chama nenhum hook do React — é pura, dá
// pra testar como função comum, sem renderizar componente.
describe('useBorderColorClass', () => {
  it('devolve a classe padrão pra "DEFAULT" ou vazio', () => {
    expect(useBorderColorClass('DEFAULT')).toBe('rounded-lg');
    expect(useBorderColorClass('')).toBe('rounded-lg');
  });

  it('devolve a classe de horário livre pra "FREE" (case-insensitive)', () => {
    expect(useBorderColorClass('free')).toContain('border-l-green-400');
    expect(useBorderColorClass('FREE')).toContain('border-l-green-400');
  });

  it('resolve a cor pela especialidade e sempre inclui border-solid', () => {
    const classe = useBorderColorClass('Terapia Ocupacional');
    expect(classe).toContain('border-to');
    expect(classe).toContain('border-solid');
  });

  it('cai no padrão pra especialidade desconhecida', () => {
    expect(useBorderColorClass('Especialidade Inexistente')).toBe('rounded-lg');
  });
});
