import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { approveEmail, signInWithGoogle } from './googleSignIn.js';

const appPath = '/the-pushup-challenge-2025/';
const rulesEndpoint = 'http://127.0.0.1:8080/emulator/v1/projects/demo-pushup-2027:securityRules';
const total = (page) => page.locator('.daily-summary strong');

test('denied write survives reload and retries once without claiming an unconfirmed total', async ({
  page,
  request,
  context,
}) => {
  const email = `retry-${Date.now()}@example.test`;
  await approveEmail(request, email);
  await page.goto(appPath);
  await signInWithGoogle(page, email);
  await expect(page.getByRole('button', { name: 'Add 20 push-ups', exact: true })).toBeEnabled();
  const originalRules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8');
  const setRules = async (content) => {
    const response = await request.put(rulesEndpoint, {
      data: { rules: { files: [{ name: 'firestore.rules', content }] } },
    });
    expect(response.ok()).toBe(true);
  };
  try {
    await setRules(
      "rules_version = '2'; service cloud.firestore { match /databases/{db}/documents { match /{all=**} { allow read: if request.auth != null; allow write: if false; } } }"
    );
    await page.getByRole('button', { name: 'Add 20 push-ups', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(total(page)).toHaveText('0');
    await expect(page.getByText('Saved', { exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('An earlier change has not been confirmed');
    await expect(total(page)).toHaveText('0');
    await setRules(originalRules);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await expect(total(page)).toHaveText('20');
    await page.reload();
    await expect(total(page)).toHaveText('20');
    await expect(page.getByRole('button', { name: /^Edit set of 20 on/ })).toHaveCount(1);
    await context.setOffline(true);
    await expect(page.getByRole('button', { name: 'Add 20 push-ups', exact: true })).toBeDisabled();
    await expect(page.getByText(/Offline\. Reconnect/)).toBeVisible();
    await expect(total(page)).toHaveText('20');
    await context.setOffline(false);
    await expect(page.getByRole('button', { name: 'Add 20 push-ups', exact: true })).toBeEnabled();
  } finally {
    await context.setOffline(false);
    await setRules(originalRules);
  }
});
