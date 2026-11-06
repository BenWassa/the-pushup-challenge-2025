import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const checksum = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const firestoreRoot = (project, database = '(default)') => {
  if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project) || !/^[\w()-]+$/.test(database)) {
    throw new TypeError('Explicit valid project and database IDs required');
  }
  return `projects/${project}/databases/${database}/documents`;
};

/** Full logical traversal, including subcollections below nonexistent ancestors. */
export async function collectBackup({ project, database = '(default)', readTime, request }) {
  if (!readTime || !Number.isFinite(Date.parse(readTime))) throw new TypeError('readTime required');
  const root = firestoreRoot(project, database);
  const documents = [];
  const collections = [];
  const visit = async (parent) => {
    let pageToken;
    do {
      const result = await request(`${parent}:listCollectionIds`, {
        method: 'POST',
        body: { pageSize: 100, readTime, ...(pageToken ? { pageToken } : {}) },
      });
      for (const collectionId of result.collectionIds || []) {
        const collection = `${parent}/${collectionId}`;
        collections.push(collection);
        let documentPage;
        do {
          const query = new URLSearchParams({ pageSize: '100', showMissing: 'true', readTime });
          if (documentPage) query.set('pageToken', documentPage);
          const page = await request(`${collection}?${query}`);
          for (const document of page.documents || []) {
            if (!document.name?.startsWith(`${collection}/`))
              throw new Error('Unexpected document path');
            if (document.createTime || document.fields) documents.push(document);
            await visit(document.name);
          }
          documentPage = page.nextPageToken;
        } while (documentPage);
      }
      pageToken = result.nextPageToken;
    } while (pageToken);
  };
  await visit(root);
  documents.sort((a, b) => a.name.localeCompare(b.name));
  return {
    formatVersion: 1,
    project,
    database,
    readTime,
    collections: collections.sort(),
    documents,
  };
}

export async function writeBackup(folder, backup) {
  await mkdir(folder, { mode: 0o700 }); // Existing destination is rejected, never overwritten.
  const digest = checksum(backup);
  await writeFile(path.join(folder, 'firestore.json'), `${JSON.stringify(backup, null, 2)}\n`, {
    mode: 0o600,
    flag: 'wx',
  });
  await writeFile(
    path.join(folder, 'manifest.json'),
    `${JSON.stringify(
      {
        formatVersion: 1,
        sha256: digest,
        project: backup.project,
        database: backup.database,
        readTime: backup.readTime,
        documentCount: backup.documents.length,
        collectionCount: backup.collections.length,
        scope:
          'Firestore document values only; excludes Auth, rules, indexes, Storage and managed backup metadata',
      },
      null,
      2
    )}\n`,
    { mode: 0o600, flag: 'wx' }
  );
  return digest;
}

export async function readBackup(folder) {
  const backup = JSON.parse(await readFile(path.join(folder, 'firestore.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(folder, 'manifest.json'), 'utf8'));
  if (manifest.sha256 !== checksum(backup) || manifest.documentCount !== backup.documents?.length) {
    throw new Error('Backup integrity verification failed');
  }
  const root = `${firestoreRoot(backup.project, backup.database)}/`;
  if (
    backup.formatVersion !== 1 ||
    manifest.formatVersion !== 1 ||
    manifest.project !== backup.project ||
    manifest.database !== backup.database ||
    manifest.readTime !== backup.readTime ||
    !Number.isFinite(Date.parse(backup.readTime)) ||
    manifest.collectionCount !== backup.collections?.length ||
    new Set(backup.documents.map((document) => document.name)).size !== backup.documents.length ||
    backup.documents.some(
      (document) =>
        !document.name?.startsWith(root) ||
        document.name.slice(root.length).split('/').length % 2 !== 0
    )
  ) {
    throw new Error('Backup scope/readTime metadata verification failed');
  }
  return { backup, manifest };
}

export function decodeValue(value) {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) {
    const number = Number(value.integerValue);
    if (!Number.isSafeInteger(number)) throw new Error('Unsafe Firestore integer');
    return number;
  }
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return Date.parse(value.timestampValue);
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  throw new Error('Unsupported migration field type; original backup remains intact');
}
export const decodeFields = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
export function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number' && Number.isSafeInteger(value))
    return { integerValue: String(value) };
  if (typeof value === 'number' && Number.isFinite(value)) return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value && typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
  throw new Error('Unsupported output field type');
}
export const encodeFields = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, encodeValue(value)]));
