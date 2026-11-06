import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const bootClasses = (source) =>
  new Set(
    [...source.matchAll(/class(?:Name)?="([^"]*)"/g)]
      .flatMap((match) => match[1].split(/\s+/))
      .filter((name) => name.startsWith('boot'))
  );

test('boot shell paints the app background before JavaScript', async () => {
  const html = await read('index.html');
  const tokens = await read('src/styles/tokens.css');
  const background = tokens.match(/--c-bg:\s*(#[0-9a-f]{6})/i)[1].toLowerCase();
  assert.match(
    html.toLowerCase(),
    new RegExp(`html,\\s*body\\s*\\{[^}]*background:\\s*${background}`)
  );
  assert.match(html, /<div id="root">\s*<div class="boot" aria-hidden="true">/);
  assert.match(html, /prefers-reduced-motion: reduce/);
});

test('static boot shell and React skeleton use the same silhouette', async () => {
  const staticShell = bootClasses((await read('index.html')).split('<body>')[1]);
  const skeleton = bootClasses(await read('src/components/home/HomeSkeleton.jsx'));
  for (const name of skeleton) {
    if (name === 'boot-skeleton') continue; // React-only wrapper carries the status role
    assert.ok(staticShell.has(name), `index.html shell is missing ${name}`);
  }
  for (const name of staticShell) {
    if (name === 'boot') continue; // static-only wrapper
    assert.ok(skeleton.has(name), `HomeSkeleton is missing ${name}`);
  }
});
