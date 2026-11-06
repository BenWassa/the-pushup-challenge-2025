// Home "Recent sets": current activity only; imported archive records are kept apart, never dropped.
export const isImported = (record) =>
  Boolean(record.provenance) || String(record.id).startsWith('legacy_');

/** Split newest-first records into recent current sets (skipping the day shown in the heatmap) and the imported archive. */
export function splitRecords(records, detailDate = null, limit = 5) {
  const current = records.filter((record) => !isImported(record));
  return {
    recent: current.filter((record) => record.localDate !== detailDate).slice(0, limit),
    hasCurrent: current.length > 0,
    imported: records.filter(isImported),
  };
}

/** Undo only reaches today's own sets, so an earlier day can never be removed by accident. */
export const latestUndoable = (records, today) =>
  records.find((record) => !isImported(record) && record.localDate === today) ?? null;
