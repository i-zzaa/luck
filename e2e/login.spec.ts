import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('exibe o formulário de login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('login bem-sucedido guarda token/usuário e sai da tela de login', async ({ page }) => {
    await page.route('**/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            login: 'terapeuta.teste',
            nome: 'Terapeuta Teste',
            perfil: 'terapeuta',
            permissoes: ['*'],
            mustChangePassword: false,
          },
          accessToken: 'fake-jwt-token',
        }),
      });
    });

    await page.goto('/');
    await page.locator('#username').fill('terapeuta.teste');
    await page.locator('#password').fill('senha-correta');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // signed vira true assim que Login() resolve -> troca PublicRoutes por
    // OtherRoutes -> sai da tela de login (não navega por URL, é troca de
    // árvore de componente).
    await expect(page.locator('#username')).toHaveCount(0, { timeout: 10_000 });

    const token = await page.evaluate(() => sessionStorage.getItem('token'));
    const auth = await page.evaluate(() => sessionStorage.getItem('auth'));
    expect(token).toBe('fake-jwt-token');
    expect(JSON.parse(auth || '{}').login).toBe('terapeuta.teste');
  });

  test('login com credenciais inválidas mostra erro e permanece na tela', async ({ page }) => {
    await page.route('**/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Usuário ou senha inválidos' }),
      });
    });

    await page.goto('/');
    await page.locator('#username').fill('terapeuta.teste');
    await page.locator('#password').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // continua na tela de login (signed nunca vira true)
    await expect(page.locator('#username')).toBeVisible();
    const token = await page.evaluate(() => sessionStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('"Lembrar login" guarda só o usuário, nunca a senha em texto plano', async ({ page }) => {
    // Regressão: sessionStorage.rememberLogin guardava {username, password}
    // em texto plano antes da correção de segurança (ver
    // src/foms/Login.tsx: handleRememberPassword).
    await page.goto('/');
    await page.locator('#username').fill('terapeuta.teste');
    await page.locator('#password').fill('senha-super-secreta');
    await page.locator('.p-checkbox-box').click();

    const stored = await page.evaluate(() => sessionStorage.getItem('rememberLogin'));
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored as string);
    expect(parsed).toEqual({ username: 'terapeuta.teste' });
    expect(parsed.password).toBeUndefined();
    expect(stored).not.toContain('senha-super-secreta');
  });

  test('desmarcar "Lembrar login" remove o dado guardado', async ({ page }) => {
    await page.goto('/');
    await page.locator('#username').fill('terapeuta.teste');
    await page.locator('.p-checkbox-box').click(); // marca
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('rememberLogin')))
      .not.toBeNull();

    await page.locator('.p-checkbox-box').click(); // desmarca
    const stored = await page.evaluate(() => sessionStorage.getItem('rememberLogin'));
    expect(stored).toBeNull();
  });

  test('recarregar a página com "Lembrar login" marcado preenche o usuário automaticamente', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('#username').fill('terapeuta.teste');
    await page.locator('.p-checkbox-box').click();
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('rememberLogin')))
      .not.toBeNull();

    await page.reload();

    await expect(page.locator('#username')).toHaveValue('terapeuta.teste');
    // a senha NUNCA é reidratada — o usuário precisa digitar de novo
    await expect(page.locator('#password')).toHaveValue('');
  });
});
