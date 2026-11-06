// Drives the Firebase Auth emulator's fake Google account chooser (fictional accounts only).
// Pass an email to sign in as the same fictional account again.
export async function signInWithGoogle(page, email) {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  const existing = email ? popup.getByText(email, { exact: false }) : null;
  if (existing && (await existing.count())) {
    await existing.first().click();
  } else {
    await popup.getByRole('button', { name: /add new account/i }).click();
    if (email) await popup.getByLabel(/email/i).fill(email);
    else await popup.getByRole('button', { name: /auto-generate/i }).click();
    await popup.getByRole('button', { name: /sign in with google/i }).click();
  }
  await popup.waitForEvent('close');
}
