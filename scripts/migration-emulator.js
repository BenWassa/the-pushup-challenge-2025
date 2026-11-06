/* global process */
import { readFile } from 'node:fs/promises';
import { readBackup, firestoreRoot } from './backup.js';
import { entryDocuments, restoreEmulatorDocuments } from './migration.js';
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const separator = arg.indexOf('=');
    if (!arg.startsWith('--') || separator < 0) throw new Error('Use --name=value arguments');
    return [arg.slice(2, separator), arg.slice(separator + 1)];
  })
);
if (!args.emulator || !args.project || !!args.backup === !!args.plan)
  throw new Error('Require --emulator, --project and exactly one of --backup or --plan');
let documents;
if (args.backup) {
  const { backup } = await readBackup(args.backup);
  const root = `${firestoreRoot(backup.project, backup.database)}/`;
  documents = backup.documents.map((document) => ({
    path: document.name.slice(root.length),
    fields: document.fields || {},
  }));
} else {
  const plan = JSON.parse(await readFile(args.plan, 'utf8'));
  if (plan.quarantine.length || plan.unmappedProfiles.length)
    throw new Error('Resolve quarantine and unmapped profiles before import rehearsal');
  documents = entryDocuments(plan);
}
console.log(
  JSON.stringify(
    await restoreEmulatorDocuments({ origin: args.emulator, project: args.project, documents })
  )
);
