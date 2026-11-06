import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { PAGES_BASE, verifyPagesBuild } from '../scripts/verify-pages-build.js';

const fixture = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pushup-pages-'));
  mkdirSync(path.join(dir, 'assets'));
  writeFileSync(path.join(dir, 'assets', 'main.js'), 'console.log("fixture")');
  writeFileSync(path.join(dir, 'icon-192.png'), 'fictional icon');
  writeFileSync(path.join(dir, 'icon-512.png'), 'fictional icon');
  writeFileSync(path.join(dir, 'sw.js'), '// fictional worker');
  writeFileSync(
    path.join(dir, 'manifest.webmanifest'),
    JSON.stringify({
      name: 'PushUp — Annual Challenge Journal',
      start_url: '.',
      scope: '.',
      display: 'standalone',
      icons: [{ src: 'icon-192.png' }, { src: 'icon-512.png' }],
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
    assert.deepEqual(verifyPagesBuild(dir), { checkedReferences: 2, checkedIcons: 2 });
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
