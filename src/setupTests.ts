import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Sem test.globals:true no vitest.config.ts, o @testing-library/react não
// registra o cleanup automático sozinho — sem isso, o DOM de um teste
// fica de pé pro próximo dentro do mesmo arquivo (getByRole passa a achar
// elementos duplicados).
afterEach(() => {
  cleanup();
});
