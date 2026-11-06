/* global process */
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { checksum, firestoreRoot } from './backup.js';
import { emulatorTarget, entryDocuments } from './migration.js';

// Owner-approved, create-only import of a reviewed migration plan into ONE account's namespace.
// Default is a dry run. --execute writes one atomic all-or-nothing batch that cannot overwrite an
// existing document, then reads every document back and compares it with the plan.
// --emulator=http://127.0.0.1:8080 with a demo- project rehearses the identical code path.
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const separator = arg.indexOf('=');
    const key = arg.slice(2, separator < 0 ? undefined : separator);
    return [key, separator < 0 ? true : arg.slice(separator + 1)];
  })
);
if (!args.project || !args.plan || !args['owner-uid'])
  throw new Error('--project, --plan and --owner-uid are required');

const plan = JSON.parse(await readFile(args.plan, 'utf8'));
if (plan.quarantine.length) throw new Error('Resolve quarantined records before import');
const documents = entryDocuments(plan);
const prefix = `participants/${args['owner-uid']}/challenges/`;
if (
  !documents.length ||
  documents.some(
    ({ path, fields }) =>
      !path.startsWith(prefix) ||
      !/^legacy_[0-9a-f]{64}$/.test(path.split('/').pop()) ||
      fields.ownerUid?.stringValue !== args['owner-uid']
  )
)
  throw new Error('Every planned document must be a legacy_ entry owned by --owner-uid');

let root;
let headers;
if (args.emulator) {
  root = emulatorTarget(args.emulator, args.project);
  headers = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };
} else {
  const require = createRequire(import.meta.url);
  const auth = require('firebase-tools/lib/auth.js');
  const account = auth.getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) throw new Error('Authenticate using firebase login first');
  const credentials = await auth.getAccessToken(account.tokens.refresh_token, [
    'https://www.googleapis.com/auth/cloud-platform',
  ]);
  root = `https://firestore.googleapis.com/v1/${firestoreRoot(args.project)}`;
  headers = {
    Authorization: `Bearer ${credentials.access_token}`,
    'Content-Type': 'application/json',
  };
}
const database = args.emulator
  ? `projects/${args.project}/databases/(default)`
  : firestoreRoot(args.project).replace(/\/documents$/, '');
const call = async (url, body) => {
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Firestore request failed (${response.status})`);
  return response.json();
};
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])])
        )
      : value;
const fetchExisting = async () => {
  const names = documents.map(({ path }) => `${database}/documents/${path}`);
  const rows = await call(`${root.replace(/\/documents$/, '')}/documents:batchGet`, {
    documents: names,
  });
  return new Map(rows.filter((row) => row.found).map((row) => [row.found.name, row.found.fields]));
};

const before = await fetchExisting();
const summary = { planned: documents.length, alreadyPresent: before.size };
if (!args.execute) {
  console.log(JSON.stringify({ mode: 'dry-run', ...summary }));
} else {
  if (before.size) throw new Error('Some planned documents already exist; refusing to overwrite');
  await call(`${root.replace(/\/documents$/, '')}/documents:commit`, {
    writes: documents.map(({ path, fields }) => ({
      update: { name: `${database}/documents/${path}`, fields },
      currentDocument: { exists: false },
    })),
  });
  const after = await fetchExisting();
  const mismatched = documents.filter(
    ({ path, fields }) =>
      checksum(canonical(after.get(`${database}/documents/${path}`) || null)) !==
      checksum(canonical(fields))
  );
  if (mismatched.length) throw new Error(`Readback mismatch for ${mismatched.length} documents`);
  console.log(
    JSON.stringify({
      mode: 'executed',
      ...summary,
      written: documents.length,
      verified: after.size,
    })
  );
}
