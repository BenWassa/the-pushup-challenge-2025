import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { approveEmail, signInWithGoogle } from './googleSignIn.js';

const appPath = '/the-pushup-challenge-2025/';
const currentYear = new Date().getFullYear();

test('fictional demo remains isolated, supports one-handed logging and resets on reload', async ({
  page,
}) => {
  await page.goto(`${appPath}?mode=demo`);
  await expect(page.getByText(/Demo · resets on reload/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add 20 push-ups' })).toBeEnabled();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');

  await page.getByRole('button', { name: 'Add 20 push-ups' }).click();
  await expect(page.locator('.daily-summary strong')).toHaveText('20');
  await expect(page.getByText('Saved · demo resets on reload')).toBeVisible();
  await page.getByRole('button', { name: /Undo latest set/ }).click();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');

  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
  await page.getByRole('button', { name: 'Account' }).click();
  await expect(page.getByText('Demo participant')).toBeVisible();

  await page.reload();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');
  await expect(page.getByText(/Demo · resets on reload/)).toBeVisible();
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
  // The full navigation is exercised at enlarged text, not only the logging screen.
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  for (const tab of ['Log', 'History', 'Account']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    const widths = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.content, `${tab}: horizontal overflow at 320px / 200% text`).toBeLessThanOrEqual(
      widths.viewport + 1
    );
  }
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByLabel('Timezone').fill('America/Vancouver');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved on this device.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await expect(page.getByLabel('Timezone')).toHaveValue('America/Vancouver');
  await page.getByRole('button', { name: 'Log', exact: true }).click();

  const findings = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  const serious = findings.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  expect(
    serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
    'Serious accessibility issues'
  ).toEqual([]);
});

test('isolated Firebase emulator confirms add, reload, history, independent-device conflict and undo', async ({
  page,
  browser,
  request,
}) => {
  const email = `pushup-test-${Date.now()}@example.test`;
  await approveEmail(request, email);

  await page.goto(appPath);
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  await signInWithGoogle(page, email);
  await expect(page.getByRole('button', { name: 'Add 10 push-ups' })).toBeEnabled();

  // The challenge year is automatic: no year picker on the Log screen.
  await expect(page.getByRole('combobox', { name: 'Challenge year' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add 10 push-ups' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await expect(page.locator('.daily-summary strong')).toHaveText('10');

  await page.reload();
  await expect(page.locator('.daily-summary strong')).toHaveText('10');
  await page.getByRole('button', { name: /Edit set of 10 on/ }).click();
  await page.getByRole('spinbutton', { name: 'Push-ups', exact: true }).fill('15');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.daily-summary strong')).toHaveText('15');
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText('15 confirmed reps')).toBeVisible();

  // A second browser context is a separate device session, not a shared-auth tab.
  const independentSession = await browser.newContext();
  const second = await independentSession.newPage();
  await second.goto(appPath);
  await signInWithGoogle(second, email);
  await expect(second.locator('.daily-summary strong')).toHaveText('15');
  await page.getByRole('button', { name: 'Log' }).click();
  await page.getByRole('button', { name: /Edit set of 15 on/ }).click();
  await page.getByRole('spinbutton', { name: 'Push-ups', exact: true }).fill('99');
  await second.getByRole('button', { name: /Edit set of 15 on/ }).click();
  await second.getByRole('spinbutton', { name: 'Push-ups', exact: true }).fill('22');
  await second.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(second.locator('.daily-summary strong')).toHaveText('22');
  await expect(page.locator('.daily-summary strong')).toHaveText('22');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('This set changed on another device.');
  await expect(page.locator('.daily-summary strong')).toHaveText('22');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: /Undo latest set/ }).click();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');
  await expect(second.locator('.daily-summary strong')).toHaveText('0');
  await independentSession.close();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Challenge year' })).toHaveValue(
    String(currentYear)
  );
  await page
    .getByRole('combobox', { name: 'Challenge year' })
    .selectOption(String(currentYear - 1));
  await expect(page.getByText('Read-only', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add 10 push-ups' })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Challenge year' }).selectOption(String(currentYear));
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  await signInWithGoogle(page, email);
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  await expect(page.locator('.daily-summary strong')).toHaveText('0');
});

test('signed-in people who are not on the closed-beta allowlist see a waiting screen and no journal', async ({
  page,
}) => {
  const email = `stranger-${Date.now()}@example.test`;
  await page.goto(appPath);
  await signInWithGoogle(page, email);
  await expect(page.getByRole('heading', { name: 'You’re not on the list yet' })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add 10 push-ups' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});

test('calendar names include visible day and count for keyboard and voice access', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2027-02-03T15:00:00Z'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${appPath}?mode=demo`);
  await expect(page.getByText('Official target pending', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  const empty = page.getByRole('button', { name: 'Day 3 0 push-ups on 2027-02-03', exact: true });
  const active = page.getByRole('button', { name: 'Day 1 25 push-ups on 2027-02-01', exact: true });
  await expect(empty).toBeVisible();
  await expect(active).toBeVisible();
  await active.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('heading', { name: '2027-02-01', exact: true })).toBeVisible();
  await expect(active).toHaveAttribute('aria-pressed', 'true');
  const findings = await new AxeBuilder({ page }).analyze();
  expect(
    findings.violations
      .filter((v) => ['critical', 'serious'].includes(v.impact))
      .map((v) => ({ id: v.id, nodes: v.nodes.length }))
  ).toEqual([]);
});
