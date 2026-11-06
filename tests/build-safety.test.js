import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

test('actual build:pages command preserves source docs and legacy output', async () => {
  // Run potentially destructive build scripts only in an expendable fixture.
  const fixture = await mkdtemp(path.join(tmpdir(), 'pushup-build-safety-'));
  try {
    for (const file of ['package.json', 'vite.config.js', 'eslint.config.js', '.prettierrc']) {
      await cp(path.join(root, file), path.join(fixture, file));
    }
    await symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
    await mkdir(path.join(fixture, 'docs/open'), { recursive: true });
    const files = ['docs/README.md', 'docs/open/issue.md', 'docs/index.html'];
    for (const file of files) await writeFile(path.join(fixture, file), `preserve ${file}\n`);
    await writeFile(path.join(fixture, 'index.html'), '<html><body>Fixture</body></html>\n');
    execFileSync('npm', ['run', 'build:pages'], { cwd: fixture, stdio: 'pipe' });
    for (const file of files) {
      assert.equal(await readFile(path.join(fixture, file), 'utf8'), `preserve ${file}\n`);
    }
    assert.match(await readFile(path.join(fixture, 'dist/index.html'), 'utf8'), /Fixture/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
