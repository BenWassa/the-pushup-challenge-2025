import { test, expect } from '@playwright/test';

const url = 'http://127.0.0.1:4174/the-pushup-challenge-2025/';

test('built PWA precaches its first-install assets and opens offline after restart', async ({
  browser,
}) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(url);
    await expect(
      page.getByRole('button', { name: 'Sign in with Google', exact: true })
    ).toBeVisible();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const manifest = await context.newCDPSession(page);
    const details = await manifest.send('Page.getAppManifest');
    expect(details.errors).toEqual([]);
    expect(JSON.parse(details.data).start_url).toBe('.');
    const cached = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      const version = new URL(registration.active.scriptURL).searchParams.get('app_version');
      const cache = await caches.open(`pushup-pwa-/the-pushup-challenge-2025/-v${version}`);
      return (await cache.keys()).map((request) => request.url);
    });
    expect(cached.some((asset) => /assets\/.*\.js$/.test(asset))).toBe(true);
    expect(cached.some((asset) => /assets\/.*\.css$/.test(asset))).toBe(true);
    await page.close();
    await context.setOffline(true);
    const offline = await context.newPage();
    await offline.goto(`${url}?from=installed`);
    await expect(
      offline.getByRole('button', { name: 'Sign in with Google', exact: true })
    ).toBeVisible();
    await expect(offline.getByRole('heading', { level: 1 })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('a new worker waits for explicit update instead of taking over immediately', async ({
  page,
}) => {
  await page.goto(url);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const original = await page.evaluate(() => navigator.serviceWorker.controller.scriptURL);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register(
      '/the-pushup-challenge-2025/sw.js?app_version=isolated-update-test',
      { updateViaCache: 'none' }
    );
  });
  await page.waitForFunction(async () =>
    Boolean((await navigator.serviceWorker.getRegistration()).waiting)
  );
  expect(await page.evaluate(() => navigator.serviceWorker.controller.scriptURL)).toBe(original);
  await expect(page.getByRole('button', { name: 'Update app', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Update app', exact: true }).click();
  await page.waitForFunction(() =>
    navigator.serviceWorker.controller?.scriptURL.includes('isolated-update-test')
  );
});
