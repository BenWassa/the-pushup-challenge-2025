/* global process */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readBackup } from './backup.js';
import { planMigration } from './migration.js';
// CLI classifier is injected via a reviewed local ES module; never infer schedule/ownership.
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const separator = arg.indexOf('=');
    if (!arg.startsWith('--') || separator < 0) throw new Error('Use --name=value arguments');
    return [arg.slice(2, separator), arg.slice(separator + 1)];
  })
);
if (
  !args.backup ||
  !args.mapping ||
  !args.classifier ||
  !args.output ||
  !args['archive-before-year']
)
  throw new Error('--backup, --mapping, --classifier, --archive-before-year and --output required');
const { backup } = await readBackup(args.backup);
const mappings = JSON.parse(await readFile(args.mapping, 'utf8'));
const { classifyDate } = await import(pathToFileURL(path.resolve(args.classifier)).href);
const plan = planMigration({
  backup,
  mappings,
  importedAt: Number(args['imported-at']),
  archiveBeforeYear: Number(args['archive-before-year']),
  classifyDate,
});
await mkdir(args.output, { mode: 0o700 });
await writeFile(path.join(args.output, 'migration.json'), `${JSON.stringify(plan, null, 2)}\n`, {
  mode: 0o600,
  flag: 'wx',
});
console.log(
  JSON.stringify({
    accepted: plan.entries.length,
    quarantined: plan.quarantine.length,
    unmappedProfiles: plan.unmappedProfiles.length,
  })
);
