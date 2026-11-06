import { expect } from '@playwright/test';

const firestore =
  'http://127.0.0.1:8080/v1/projects/demo-pushup-2027/databases/(default)/documents';

// Adds a fictional email to the closed-beta allowlist. The emulator's "owner" token bypasses
// the rules, mirroring how the real owner would add someone with the console or Admin SDK.
export async function approveEmail(request, email) {
  const response = await request.patch(`${firestore}/allowlist/${encodeURIComponent(email)}`, {
    headers: { Authorization: 'Bearer owner' },
    data: { fields: { approved: { booleanValue: true } } },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

// Drives the Firebase Auth emulator's fake Google account chooser (fictional accounts only).
// Sign-in is a full-page redirect there and back, so everything happens in the same tab.
export async function signInWithGoogle(page, email) {
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await page.waitForURL(/emulator\/auth\/handler/);
  const existing = page.getByText(email, { exact: false });
  if (await existing.count()) {
    await existing.first().click();
  } else {
    await page.getByRole('button', { name: /add new account/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('button', { name: /sign in with google/i }).click();
  }
  await page.waitForURL((url) => !url.pathname.includes('/emulator/auth/handler'));
}
