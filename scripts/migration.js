import { checksum, decodeFields, encodeFields, firestoreRoot } from './backup.js';
import { normalizeLegacyActivity } from '../src/utils/activity.js';

const safeId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);

/** Pure dry run. Explicit mapping and classifier are mandatory; no username guessing. */
export function planMigration({ backup, mappings, importedAt, classifyDate }) {
  if (!Number.isSafeInteger(importedAt) || importedAt < 0)
    throw new TypeError('Explicit importedAt required');
  if (!mappings || typeof classifyDate !== 'function')
    throw new TypeError('Mapping and classifier required');
  const sourceRoot = `${firestoreRoot(backup.project, backup.database)}/`;
  const snapshotId = checksum(backup);
  const entries = [];
  const quarantine = [];
  const reconciliation = [];
  const provenance = [];
  const seenOwners = new Set();
  for (const [profilePath, mapping] of Object.entries(mappings)) {
    if (!/^artifacts\/[^/]+\/public\/data\/users\/[^/]+$/.test(profilePath))
      throw new Error('Explicit legacy profile path required');
    if (
      !safeId(mapping.ownerUid) ||
      !Number.isInteger(mapping.challengeYear) ||
      mapping.challengeYear >= 2027
    )
      throw new Error('Reviewed owner and archived year required');
    const ownerYear = `${mapping.ownerUid}/${mapping.challengeYear}`;
    if (seenOwners.has(ownerYear))
      throw new Error(
        'Multiple legacy profiles mapped to one owner/year require manual reconciliation'
      );
    seenOwners.add(ownerYear);
    const document = backup.documents.find((item) => item.name === `${sourceRoot}${profilePath}`);
    if (!document) throw new Error('Mapped profile absent from frozen backup');
    const profile = decodeFields(document.fields || {});
    if (!Array.isArray(profile.logs)) throw new Error('Mapped profile lacks a logs array');
    const report = {
      profilePath,
      ownerUid: mapping.ownerUid,
      challengeYear: mapping.challengeYear,
      sourceCount: profile.logs.length,
      sourceAmount: 0,
      acceptedCount: 0,
      acceptedAmount: 0,
      quarantinedCount: 0,
      legacyCounters: {
        training: profile.training_reps ?? null,
        official: profile.official_reps ?? null,
      },
      totals: { TRAINING: 0, OFFICIAL: 0, OFF_SEASON: 0 },
      daily: {},
    };
    profile.logs.forEach((log, index) => {
      if (Number.isSafeInteger(log.amount) && log.amount > 0) report.sourceAmount += log.amount;
      const normalized = normalizeLegacyActivity(log, {
        ownerUid: mapping.ownerUid,
        timeZone: mapping.timeZone,
        sourceId: `${snapshotId}/${profilePath}`,
        index,
        classifyDate: (localDate) => classifyDate(localDate, mapping, log),
      });
      if (!normalized.record || normalized.record.challengeYear !== mapping.challengeYear) {
        quarantine.push({
          profilePath,
          index,
          reason: normalized.reason || 'mapping-year-mismatch',
          original: log,
        });
        report.quarantinedCount += 1;
        return;
      }
      const record = normalized.record;
      const id = `legacy_${checksum({ snapshotId, profilePath, index })}`;
      const entry = {
        schemaVersion: 2,
        id,
        ownerUid: record.ownerUid,
        challengeYear: record.challengeYear,
        localDate: record.localDate,
        phase: record.phase,
        timeZone: record.timeZone,
        amount: record.amount,
        // Unknown historical instants remain null; import time is separate.
        createdAt: record.createdAt,
        provenance: record.provenance,
        updatedAt: importedAt,
        revision: 1,
        deleted: false,
        lastOperationId: id,
      };
      entries.push({
        path: `participants/${entry.ownerUid}/challenges/${entry.challengeYear}/entries/${id}`,
        data: entry,
      });
      provenance.push({
        id,
        profilePath,
        index,
        original: log,
        sourceCreatedAt: record.createdAt,
        originalSeason: log.season ?? null,
      });
      report.acceptedCount += 1;
      report.acceptedAmount += record.amount;
      report.totals[record.phase] += record.amount;
      report.daily[record.localDate] = (report.daily[record.localDate] || 0) + record.amount;
    });
    reconciliation.push(report);
  }
  const unmappedProfiles = backup.documents
    .filter(
      (document) =>
        /^artifacts\/[^/]+\/public\/data\/users\/[^/]+$/.test(
          document.name.slice(sourceRoot.length)
        ) && !Object.hasOwn(mappings, document.name.slice(sourceRoot.length))
    )
    .map((document) => document.name.slice(sourceRoot.length));
  return {
    formatVersion: 1,
    snapshotId,
    importedAt,
    entries,
    provenance,
    quarantine,
    reconciliation,
    unmappedProfiles,
  };
}

export function emulatorTarget(origin, project) {
  const url = new URL(origin);
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !/^demo-[a-z0-9-]+$/.test(project)
  )
    throw new Error('Writes require localhost emulator and a demo- project');
  return `${url.origin}/v1/${firestoreRoot(project)}`;
}

/** Emulator-only create/verify. Existing differing records abort; nothing is overwritten/deleted. */
export async function restoreEmulatorDocuments({ origin, project, documents, request = fetch }) {
  const root = emulatorTarget(origin, project);
  let created = 0;
  let unchanged = 0;
  for (const { path, fields } of documents) {
    if (
      !path ||
      path.split('/').length % 2 ||
      path.split('/').some((part) => !part || part === '.' || part === '..')
    )
      throw new Error('Invalid relative document path');
    const url = `${root}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const response = await request(`${url}?currentDocument.exists=false`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    if (response.ok) created += 1;
    else if (response.status === 409) unchanged += 1;
    else throw new Error(`Emulator restore failed (${response.status})`);
    const read = await request(url, { headers: { Authorization: 'Bearer owner' } });
    if (!read.ok) throw new Error('Emulator readback failed');
    const actual = (await read.json()).fields || {};
    // Firestore can reorder field keys. Compare field values recursively by canonical keys.
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
    if (checksum(canonical(actual)) !== checksum(canonical(fields)))
      throw new Error('Emulator reconciliation mismatch; existing data retained');
  }
  return { created, unchanged, verified: created + unchanged };
}
export const entryDocuments = (plan) =>
  plan.entries.map((entry) => ({ path: entry.path, fields: encodeFields(entry.data) }));
