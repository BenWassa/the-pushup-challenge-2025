/* global process */
import { createRequire } from 'node:module';
import { collectBackup, writeBackup } from './backup.js';

// Read only. No production restore/import command is provided.
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const separator = arg.indexOf('=');
    if (!arg.startsWith('--') || separator < 0) throw new Error('Use --name=value arguments');
    return [arg.slice(2, separator), arg.slice(separator + 1)];
  })
);
if (!args.project || !args.output) throw new Error('--project and --output are required');
const require = createRequire(import.meta.url);
const auth = require('firebase-tools/lib/auth.js');
const account = auth.getGlobalDefaultAccount();
if (!account?.tokens?.refresh_token) throw new Error('Authenticate using firebase login first');
const credentials = await auth.getAccessToken(account.tokens.refresh_token, [
  'https://www.googleapis.com/auth/cloud-platform',
]);
const request = async (resource, { method = 'GET', body } = {}) => {
  const response = await fetch(`https://firestore.googleapis.com/v1/${resource}`, {
    method,
    headers: {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(`Firestore read failed (${response.status}); no complete backup created`);
  return response.json();
};
const backup = await collectBackup({
  project: args.project,
  database: args.database || '(default)',
  readTime: args['read-time'] || new Date().toISOString(),
  request,
});
const sha256 = await writeBackup(args.output, backup);
console.log(
  JSON.stringify({
    documentCount: backup.documents.length,
    collectionCount: backup.collections.length,
    sha256,
  })
);
