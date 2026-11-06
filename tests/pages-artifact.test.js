import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { PAGES_BASE, verifyPagesBuild } from '../scripts/verify-pages-build.js';

const validManifest = {
  id: PAGES_BASE,
  name: 'PushUp — Annual Challenge Journal',
  short_name: 'PushUp',
  lang: 'en-CA',
  start_url: '.',
  scope: '.',
  display: 'standalone',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', purpose: 'any' },
    { src: 'icon-512-maskable.png', sizes: '512x512', purpose: 'maskable' },
  ],
  screenshots: [{ src: 'shot.png', sizes: '10x10', type: 'image/png', form_factor: 'narrow' }],
};

const fixture = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pushup-pages-'));
  mkdirSync(path.join(dir, 'assets'));
  writeFileSync(path.join(dir, 'assets', 'main.js'), 'console.log("fixture")');
  writeFileSync(path.join(dir, 'icon-192.png'), 'fictional icon');
  writeFileSync(path.join(dir, 'icon-512.png'), 'fictional icon');
  writeFileSync(path.join(dir, 'icon-512-maskable.png'), 'fictional icon');
  writeFileSync(path.join(dir, 'shot.png'), 'fictional screenshot');
  writeFileSync(path.join(dir, 'sw.js'), '// fictional worker');
  writeFileSync(path.join(dir, 'precache-manifest.json'), JSON.stringify(['assets/main.js']));
  writeFileSync(
    path.join(dir, 'manifest.webmanifest'),
    JSON.stringify({
      ...validManifest,
    })
  );
  writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html><html><head><title>PushUp — Annual Challenge Journal</title><link rel="manifest" href="${PAGES_BASE}manifest.webmanifest"></head><body><script src="${PAGES_BASE}assets/main.js"></script></body></html>`
  );
  return dir;
};

test('Pages artifact preflight accepts a correctly scoped, complete build', () => {
  const dir = fixture();
  try {
    assert.deepEqual(verifyPagesBuild(dir), { checkedReferences: 2, checkedIcons: 3 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Pages artifact preflight rejects origin-root links, missing assets and unsafe icon paths', () => {
  const dir = fixture();
  try {
    const html = path.join(dir, 'index.html');
    writeFileSync(
      html,
      '<html><head><title>PushUp — Annual Challenge Journal</title><link rel="manifest" href="/manifest.webmanifest"></head><body><script src="/assets/main.js"></script></body></html>'
    );
    assert.throws(() => verifyPagesBuild(dir), /Manifest must use/);
    writeFileSync(
      html,
      `<html><head><title>PushUp — Annual Challenge Journal</title><link rel="manifest" href="${PAGES_BASE}manifest.webmanifest"></head><body><script src="${PAGES_BASE}assets/missing.js"></script></body></html>`
    );
    assert.throws(() => verifyPagesBuild(dir), /Missing build asset/);
    writeFileSync(
      html,
      `<html><head><title>PushUp — Annual Challenge Journal</title><link rel="manifest" href="${PAGES_BASE}manifest.webmanifest"></head><body><script src="${PAGES_BASE}assets/main.js"></script></body></html>`
    );
    writeFileSync(
      path.join(dir, 'manifest.webmanifest'),
      JSON.stringify({
        name: 'PushUp — Annual Challenge Journal',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        icons: [{ src: '../secret.png' }, { src: 'icon-512.png' }],
      })
    );
    assert.throws(() => verifyPagesBuild(dir), /PWA icon must use/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Pages artifact preflight rejects incomplete and unsafe offline manifests', () => {
  const dir = fixture();
  try {
    for (const assets of [[], ['../other.js'], ['assets/missing.js']]) {
      writeFileSync(path.join(dir, 'precache-manifest.json'), JSON.stringify(assets));
      assert.throws(() => verifyPagesBuild(dir), /Offline|offline|Missing build asset/);
    }
    writeFileSync(path.join(dir, 'assets', 'other.js'), 'fixture');
    writeFileSync(path.join(dir, 'precache-manifest.json'), JSON.stringify(['assets/other.js']));
    assert.throws(() => verifyPagesBuild(dir), /omits an entrypoint/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Pages artifact preflight enforces installable, accessible manifest standards', () => {
  const dir = fixture();
  const write = (manifest) =>
    writeFileSync(path.join(dir, 'manifest.webmanifest'), JSON.stringify(manifest));
  try {
    assert.doesNotThrow(() => verifyPagesBuild(dir));
    write({ ...validManifest, id: '/other/' });
    assert.throws(() => verifyPagesBuild(dir), /manifest id/);
    write({ ...validManifest, orientation: 'portrait' });
    assert.throws(() => verifyPagesBuild(dir), /lock orientation/);
    write({ ...validManifest, icons: validManifest.icons.slice(0, 2) });
    assert.throws(() => verifyPagesBuild(dir), /512x512 maskable/);
    write({ ...validManifest, screenshots: [{ src: 'missing.png' }] });
    assert.throws(() => verifyPagesBuild(dir), /Missing build asset/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
