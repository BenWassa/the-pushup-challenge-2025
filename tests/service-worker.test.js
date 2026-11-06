import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const scope = 'https://example.test/the-pushup-challenge-2025/';
const current = 'pushup-pwa-/the-pushup-challenge-2025/-v2-2027-brush';

const worker = ({
  names = [],
  entries = new Map(),
  response,
  offline = false,
  failCache = '',
} = {}) => {
  const listeners = {};
  const deleted = [];
  const writes = [];
  const opened = [];
  const skipWaiting = [];
  const precached = [];
  const matches = [];
  const key = (request) => (typeof request === 'string' ? request : request.url);
  const cache = {
    match: async (request, options) => {
      matches.push({ request: key(request), ignoreVary: options?.ignoreVary });
      if (failCache === 'match') throw new Error('cache read failed');
      return entries.get(key(request));
    },
    addAll: async (urls) => precached.push(...urls),
    put: async (request, value) => {
      if (failCache === 'put') throw new Error('quota exceeded');
      writes.push(key(request));
      entries.set(key(request), value);
    },
  };
  vm.runInNewContext(source, {
    URL,
    self: {
      location: new URL(`${scope}sw.js?app_version=2`),
      registration: { scope },
      addEventListener: (name, listener) => (listeners[name] = listener),
      clients: { claim: async () => {} },
      skipWaiting: () => {
        skipWaiting.push(true);
        return Promise.resolve();
      },
    },
    caches: {
      keys: async () => names,
      delete: async (name) => deleted.push(name),
      open: async (name) => {
        if (failCache === 'open') throw new Error('cache unavailable');
        opened.push(name);
        return cache;
      },
    },
    fetch: async () => {
      if (offline) throw new Error('offline');
      return response;
    },
  });
  return { listeners, deleted, writes, opened, skipWaiting, precached, matches };
};

const fetchFrom = (app, url, mode = 'navigate', method = 'GET') => {
  let result;
  app.listeners.fetch({ request: { url, mode, method }, respondWith: (value) => (result = value) });
  return result;
};

test('install does not activate over a running app until the UI requests it', async () => {
  const app = worker({
    response: { ok: true, json: async () => ['assets/main.js', 'assets/main.css'] },
  });
  let install;
  app.listeners.install({ waitUntil: (value) => (install = value) });
  await install;
  assert.equal(app.skipWaiting.length, 0);
  assert.ok(app.precached.includes(`${scope}index.html`));
  assert.ok(app.precached.includes(`${scope}manifest.webmanifest`));
  assert.ok(app.precached.includes(`${scope}assets/main.js`));
  assert.ok(app.precached.includes(`${scope}assets/main.css`));

  app.listeners.message({ data: { type: 'OTHER' } });
  assert.equal(app.skipWaiting.length, 0);
  app.listeners.message({ data: { type: 'SKIP_WAITING' } });
  assert.equal(app.skipWaiting.length, 1);
});

test('activation removes only prior caches belonging to this app scope', async () => {
  const old = 'pushup-pwa-/the-pushup-challenge-2025/-v2';
  const app = worker({ names: [current, old, 'other-app', 'pushup-pwa-/other/-v1'] });
  let result;
  app.listeners.activate({ waitUntil: (value) => (result = value) });
  await result;
  assert.deepEqual(app.deleted, [old]);
});

test('offline navigation with a query falls back to the current app shell', async () => {
  const shell = { body: 'current shell' };
  const app = worker({ offline: true, entries: new Map([[`${scope}index.html`, shell]]) });
  assert.equal(await fetchFrom(app, `${scope}?edition=2027`), shell);
  assert.deepEqual(app.opened, [current]);
});

test('HTTP errors are returned without poisoning navigation or asset caches', async () => {
  const response = { ok: false, status: 503, clone: () => response };
  for (const mode of ['navigate', 'cors']) {
    const app = worker({ response });
    assert.equal(await fetchFrom(app, `${scope}file`, mode), response);
    assert.deepEqual(app.writes, []);
  }
});

test('successful requests cache and reuse responses; unrelated requests are untouched', async () => {
  const response = { ok: true, clone: () => response };
  const app = worker({ response });
  assert.equal(await fetchFrom(app, `${scope}asset.js`, 'cors'), response);
  assert.equal(await fetchFrom(app, `${scope}asset.js`, 'cors'), response);
  assert.deepEqual(app.writes, [`${scope}asset.js`]);
  assert.equal(fetchFrom(app, 'https://firestore.googleapis.com/data'), undefined);
  assert.equal(fetchFrom(app, 'https://example.test/another-app/'), undefined);
  assert.equal(fetchFrom(app, `${scope}submit`, 'cors', 'POST'), undefined);
});

for (const operation of ['open', 'match', 'put']) {
  test(`cache ${operation} failure preserves successful navigation and asset responses`, async () => {
    const response = { ok: true, clone: () => response };
    for (const mode of ['navigate', 'cors']) {
      const app = worker({ response, failCache: operation });
      assert.equal(await fetchFrom(app, `${scope}file`, mode), response);
    }
  });
}

for (const assets of [['../other/app.js'], ['https://other.test/app.js'], null]) {
  test(`install rejects an invalid offline asset manifest: ${JSON.stringify(assets)}`, async () => {
    const app = worker({ response: { ok: true, json: async () => assets } });
    let install;
    app.listeners.install({ waitUntil: (value) => (install = value) });
    await assert.rejects(install, /Invalid offline asset manifest/);
    assert.equal(app.precached.length, 0);
    assert.equal(app.skipWaiting.length, 0);
  });
}

test('only public built assets ignore Vary when matching precached responses', async () => {
  const response = { ok: true, clone: () => response };
  for (const [path, expected] of [
    ['assets/app-hash.js', true],
    ['assets/app-hash.css', true],
    ['manifest.webmanifest', false],
    ['account.json', false],
  ]) {
    const app = worker({ response });
    await fetchFrom(app, `${scope}${path}`, 'cors');
    assert.equal(app.matches[0].ignoreVary, expected, path);
  }
});
