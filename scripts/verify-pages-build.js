/* global process */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PAGES_BASE = '/the-pushup-challenge-2025/';

function requireFile(directory, filename) {
  const resolved = path.resolve(directory, filename);
  if (!resolved.startsWith(`${path.resolve(directory)}${path.sep}`))
    throw new Error(`Asset path escapes build: ${filename}`);
  if (!existsSync(resolved) || !statSync(resolved).isFile())
    throw new Error(`Missing build asset: ${filename}`);
  return resolved;
}

/** Validate the exact built static site before it is eligible for Pages publication. */
export function verifyPagesBuild(directory, base = PAGES_BASE) {
  assert.ok(base.startsWith('/') && base.endsWith('/'), 'Pages base must be a path');
  const html = readFileSync(requireFile(directory, 'index.html'), 'utf8');
  if (html.includes('%BASE_URL%')) throw new Error('Unresolved Vite base token');
  if (!html.includes(`href="${base}manifest.webmanifest"`))
    throw new Error('Manifest must use the repository Pages base URL');
  if (!html.includes('PushUp — Annual Challenge Journal'))
    throw new Error('Expected current annual app title');

  const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  let scripts = 0;
  for (const reference of references) {
    if (/^(https?:|data:|mailto:|#)/.test(reference)) continue;
    if (!reference.startsWith(base))
      throw new Error(`Built local asset is outside Pages base: ${reference}`);
    const relative = decodeURIComponent(reference.slice(base.length).split(/[?#]/)[0]);
    requireFile(directory, relative);
    if (/\.js(?:[?#]|$)/.test(reference)) scripts += 1;
  }
  if (scripts === 0) throw new Error('No built JavaScript entrypoint');

  const manifest = JSON.parse(readFileSync(requireFile(directory, 'manifest.webmanifest'), 'utf8'));
  if (manifest.start_url !== '.' || manifest.scope !== '.' || manifest.display !== 'standalone')
    throw new Error('PWA manifest must remain scoped to the Pages repository path');
  if (!manifest.name?.startsWith('PushUp') || /2025|2026/.test(manifest.name))
    throw new Error('PWA install name contains legacy branding');
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2)
    throw new Error('Expected installable app icons');
  for (const icon of manifest.icons) {
    if (!icon.src || icon.src.startsWith('/') || icon.src.includes('..'))
      throw new Error('PWA icon must use a safe repository-relative URL');
    requireFile(directory, icon.src);
  }
  requireFile(directory, 'sw.js');
  return { checkedReferences: references.length, checkedIcons: manifest.icons.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = verifyPagesBuild(path.resolve(process.cwd(), 'dist'));
  process.stdout.write(
    `Pages artifact verified: ${result.checkedReferences} references, ${result.checkedIcons} icons.\n`
  );
}
