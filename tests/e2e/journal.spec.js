import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const appPath = '/the-pushup-challenge-2025/';
const currentYear = new Date().getFullYear();

test('fictional demo remains isolated, supports one-handed logging and resets on reload', async ({ page }) => {
  await page.goto(`${appPath}?mode=demo`);
  await expect(page.getByText(/Fictional demo · changes reset on reload/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add 20 push-ups' })).toBeEnabled();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');

  await page.getByRole('button', { name: 'Add 20 push-ups' }).click();
  await expect(page.locator('.daily-summary strong')).toHaveText('20');
  await expect(page.getByText('Saved in this demo. Resets on reload.')).toBeVisible();
  await page.getByRole('button', { name: /Undo latest set/ }).click();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');

  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
  await page.getByRole('button', { name: 'Account' }).click();
  await expect(page.getByText('Fictional demo participant')).toBeVisible();

  await page.reload();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');
  await expect(page.getByText(/Fictional demo · changes reset on reload/)).toBeVisible();
});

test('mobile viewports do not overflow and show no serious automated accessibility issues', async ({
  page,
}) => {
  await page.goto(`${appPath}?mode=demo`);
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole('button', { name: 'Add 10 push-ups' })).toBeVisible();
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(metrics.scrollWidth, `Horizontal overflow at ${width}px`).toBeLessThanOrEqual(
      metrics.viewport + 1
    );
  }
  const findings = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = findings.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  expect(
    serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
    'Serious accessibility issues'
  ).toEqual([]);
});

test('isolated Firebase emulator confirms add, reload, history, two-tab sync and undo', async ({
  page,
  context,
  request,
}) => {
  const email = `pushup-test-${Date.now()}@example.test`;
  const password = 'LocalEmulatorTest2027!';
  const response = await request.post(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',
    { data: { email, password, returnSecureToken: true } }
  );
  expect(response.ok(), await response.text()).toBeTruthy();

  await page.goto(appPath);
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Add 10 push-ups' })).toBeEnabled();

  await expect(page.getByRole('combobox', { name: 'Challenge year' })).toHaveValue(
    String(currentYear)
  );
  await page.getByRole('button', { name: 'Add 10 push-ups' }).click();
  await expect(page.getByText('Saved to your account.')).toBeVisible();
  await expect(page.locator('.daily-summary strong')).toHaveText('10');

  await page.reload();
  await expect(page.locator('.daily-summary strong')).toHaveText('10');
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText('10 confirmed push-ups')).toBeVisible();

  const second = await context.newPage();
  await second.goto(appPath);
  await expect(second.locator('.daily-summary strong')).toHaveText('10');
  await page.getByRole('button', { name: 'Log' }).click();
  await page.getByRole('button', { name: /Undo latest set/ }).click();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');
  await expect(second.locator('.daily-summary strong')).toHaveText('0');
  await second.close();
});
