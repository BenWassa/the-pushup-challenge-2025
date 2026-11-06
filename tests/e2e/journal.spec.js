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
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('0');

  await page.getByRole('button', { name: 'Add 20 push-ups' }).click();
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('20');
  await expect(page.getByText('Saved · demo resets on reload')).toBeVisible();
  await page.getByRole('button', { name: /Undo latest set/ }).click();
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('0');

  // One scrolling Home: the activity heatmap is rendered in place, no tabs to open.
  await expect(page.getByRole('heading', { name: /^[A-Z][a-z]+ \d{4}$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Demo participant')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('0');
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
  for (const screen of ['Home', 'Settings']) {
    if (screen === 'Settings') await page.getByRole('button', { name: 'Settings' }).click();
    const tab = screen;
    const widths = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.content, `${tab}: horizontal overflow at 320px / 200% text`).toBeLessThanOrEqual(
      widths.viewport + 1
    );
  }
  await page.getByLabel('Timezone').fill('America/Vancouver');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved on this device.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByLabel('Timezone')).toHaveValue('America/Vancouver');
  await page.getByRole('button', { name: 'Home', exact: true }).click();

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
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('10');

  await page.reload();
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('10');
  await page.getByRole('button', { name: /Edit set of 10 on/ }).click();
  await page.getByRole('spinbutton', { name: 'Push-ups', exact: true }).fill('15');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('15');
  await expect(page.getByText('15 push-ups', { exact: true })).toBeVisible();

  // A second browser context is a separate device session, not a shared-auth tab.
  const independentSession = await browser.newContext();
  const second = await independentSession.newPage();
  await second.goto(appPath);
  await signInWithGoogle(second, email);
  await expect(second.getByTestId('primary-total').locator('strong')).toHaveText('15');
  await page
    .getByRole('button', { name: /Edit set of 15 on/ })
    .first()
    .click();
  await page.getByRole('spinbutton', { name: 'Push-ups', exact: true }).fill('99');
  await second.getByRole('button', { name: /Edit set of 15 on/ }).click();
  await second.getByRole('spinbutton', { name: 'Push-ups', exact: true }).fill('22');
  await second.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(second.getByTestId('primary-total').locator('strong')).toHaveText('22');
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('22');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('This set changed on another device.');
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('22');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: /Undo latest set/ }).click();
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('0');
  await expect(second.getByTestId('primary-total').locator('strong')).toHaveText('0');
  await independentSession.close();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: String(currentYear - 1), exact: true }).click();
  await expect(page.getByText(`Viewing ${currentYear - 1} · read-only`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add 10 push-ups' })).toHaveCount(0);
  await page.getByRole('button', { name: `Back to ${currentYear}` }).click();
  await expect(page.getByRole('button', { name: 'Add 10 push-ups' })).toBeEnabled();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  await signInWithGoogle(page, email);
  await expect(page.getByTestId('primary-total').locator('strong')).toHaveText('0');
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

test('activity squares are named with date and total and work from the keyboard', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2027-02-03T15:00:00Z'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${appPath}?mode=demo`);
  await expect(page.getByText('Official daily target pending', { exact: true })).toBeVisible();
  const empty = page.getByRole('button', { name: /^Wednesday, February 3, 2027: No push-ups/ });
  const active = page.getByRole('button', {
    name: /^Monday, February 1, 2027: 25 push-ups\. Training\./,
  });
  await expect(empty).toHaveAttribute('aria-current', 'date');
  await expect(active).toBeVisible();
  // Weekday alignment: Feb 1, 2027 is a Monday, so it is the second column of the first row.
  const first = await active.boundingBox();
  const grid = await page.locator('.as-grid').boundingBox();
  expect(first.x - grid.x).toBeGreaterThan(grid.width / 7 - 4);
  expect(first.x - grid.x).toBeLessThan((grid.width / 7) * 2);
  await active.click();
  await expect(page.getByRole('heading', { name: 'Monday, February 1, 2027' })).toBeVisible();
  await expect(active).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'Tuesday, February 2, 2027' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^Tuesday, February 2, 2027: 20 push-ups/ })
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('heading', { name: 'Tuesday, February 9, 2027' })).toBeVisible();
  await page.keyboard.press('PageDown');
  await expect(page.getByRole('heading', { name: 'March 2027' })).toBeVisible();
  const findings = await new AxeBuilder({ page }).analyze();
  expect(
    findings.violations
      .filter((v) => ['critical', 'serious'].includes(v.impact))
      .map((v) => ({ id: v.id, nodes: v.nodes.length }))
  ).toEqual([]);
});

test('fictional Feb 10 2027 fixture shows 60 today, 445 / 2,000 and a streak, and logs/undoes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${appPath}?mode=demo&fixture=feb-10-2027`);
  const today = page.getByTestId('primary-total').locator('strong');
  await expect(today).toHaveText('60');
  await expect(page.getByTestId('official-total')).toHaveText('445 / 2,000');
  await expect(
    page.getByRole('progressbar', { name: 'Official challenge progress' })
  ).toHaveAttribute('aria-valuetext', '445 of 2000 push-ups');
  await expect(page.locator('.streak')).toHaveText(/7\s*day streak/);
  await expect(page.getByRole('button', { name: /Undo latest set \(20\)/ })).toBeEnabled();
  await page.getByRole('button', { name: 'Add 25 push-ups' }).click();
  await expect(today).toHaveText('85');
  await expect(page.getByTestId('official-total')).toHaveText('470 / 2,000');
  await page.getByRole('button', { name: /Undo latest set \(25\)/ }).click();
  await expect(today).toHaveText('60');
});
