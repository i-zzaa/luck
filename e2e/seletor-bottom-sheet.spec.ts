import { test, expect, type Page } from '@playwright/test';

// Seletor em bottom sheet (components/seletorBottomSheet) — regressão: o
// PrimeReact fixa `.p-sidebar-bottom .p-sidebar { height: 10rem }` e,
// dependendo da ordem dos CSS, o sheet saía com 10rem: cabeçalho + busca
// e a lista cortada logo no primeiro item. Com lista longa (clínica de
// verdade tem centenas de pacientes) o sheet tem que ocupar até 85% da
// tela e a lista rolar por dentro.

const PACIENTES = Array.from({ length: 287 }, (_, i) => ({
  id: i + 1,
  nome: `Paciente ${String(i + 1).padStart(3, '0')}`,
}));

const mockApi = (page: Page) =>
  page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('localhost:')) return route.continue();
    const data = url.includes('paciente/dropdown') ? PACIENTES : [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
  });

const authInit = (page: Page) => {
  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return page.addInitScript(([f]) => {
    sessionStorage.setItem('token', 'token-teste');
    sessionStorage.setItem('expiresAt', f as string);
    sessionStorage.setItem(
      'auth',
      JSON.stringify({
        id: 1,
        login: 'terapeuta.teste',
        nome: 'Teste',
        permissoes: ['PEI_FILTRO_BOTAO_CADASTRAR'],
        perfil: { codigo: 'developer' },
      })
    );
  }, [future]);
};

test('lista longa: o sheet ocupa até 85% da tela e mostra vários itens', async ({ page }) => {
  await mockApi(page);
  await authInit(page);
  await page.goto('/protocolo-av');
  await page.waitForLoadState('networkidle');

  await page.getByTestId('seletor-pacienteId').click();
  await expect(page.getByText('287 opções')).toBeVisible();

  const altura = page.viewportSize()!.height;
  const sheet = page.locator('.p-sidebar.seletor-sheet');
  const caixa = await sheet.boundingBox();
  expect(caixa!.height).toBeGreaterThan(altura * 0.6);
  expect(caixa!.height).toBeLessThanOrEqual(altura * 0.85 + 1);

  // vários itens visíveis de uma vez, não só o primeiro cortado
  for (const nome of ['Paciente 001', 'Paciente 005', 'Paciente 008']) {
    await expect(page.getByRole('option', { name: nome })).toBeInViewport();
  }

  // a lista rola por dentro e a busca filtra
  await page.getByRole('searchbox', { name: 'Buscar em Paciente' }).fill('287');
  await page.getByRole('option', { name: 'Paciente 287' }).click();
  // escolhido: o seletor dá lugar ao cabeçalho do paciente (Protocolo.tsx)
  await expect(page.getByText('Paciente 287', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trocar' })).toBeVisible();
});
