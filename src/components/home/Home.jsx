import YearArchive from './YearArchive.jsx';
import HomeHeader from './HomeHeader.jsx';
import ProgressSummary from './ProgressSummary.jsx';
import QuickLog from './QuickLog.jsx';
import ActivitySquares from './ActivitySquares.jsx';
import { computeStreak } from '../../utils/streak.js';
import { progressSubject } from '../../utils/century.js';

const phaseLabel = (phase) =>
  ({ TRAINING: 'Training', OFFICIAL: 'Official', OFF_SEASON: 'Off-season' })[phase];
function dayNote(challenge) {
  const { day } = challenge;
  if (day.isRestDay) return 'Rest day · activity optional';
  if (day.dailyTarget !== null) return `Daily target: ${day.dailyTarget}`;
  if (day.phase === 'TRAINING' && challenge.trainingGoal)
    return `Training goal: ${challenge.trainingGoal}`;
  if (day.phase === 'OFFICIAL') return 'Official daily target pending';
  return null;
}

/** The single scrolling Home: everything useful is rendered here, nothing is a gateway. */
export default function Home({
  challenge,
  data,
  auth,
  busy,
  latest,
  onAdd,
  onSettings,
  onHistory,
  onBackToCurrent,
}) {
  const { summary, selectedYear, canLog } = challenge;
  if (!canLog) {
    return (
      <YearArchive
        challenge={challenge}
        onBackToCurrent={onBackToCurrent}
        onSettings={onSettings}
        onHistory={onHistory}
      />
    );
  }
  const canEdit = challenge.canLog && data.canWrite && !busy;
  const primary = canLog
    ? {
        value: summary.todayTotal,
        unit: 'today',
        note: dayNote(challenge),
      }
    : { label: `${selectedYear} · confirmed`, value: summary.total, unit: 'push-ups' };
  // Progress in hundreds. Today's phase decides which total it is about; an archived year only
  // shows the official total (read-only), and a year with no official challenge shows nothing.
  const target = challenge.challenge?.totalTarget ?? null;
  const subject = canLog
    ? progressSubject({ phase: challenge.day.phase, summary, target })
    : target
      ? progressSubject({ phase: 'OFFICIAL', summary, target })
      : null;
  const century = subject
    ? {
        subject,
        canCompact: canLog,
        persist: canLog && !auth.isDemoMode,
        loading: Boolean(data.loading),
        storageKey: `pushup.century.${selectedYear}.${subject.category}`,
      }
    : null;
  const streak =
    canLog && challenge.day.phase === 'OFFICIAL'
      ? computeStreak(summary.byDate, challenge.today)
      : 0;
  return (
    <div className="home">
      <HomeHeader
        year={selectedYear}
        phaseLabel={canLog ? phaseLabel(challenge.day.phase) : 'Archive · read-only'}
        onSettings={onSettings}
      />
      <ProgressSummary primary={primary} century={century} streak={streak} />
      {canLog && (
        <QuickLog
          disabled={!canEdit || data.loading}
          onAdd={onAdd}
          undo={
            latest
              ? {
                  amount: latest.amount,
                  disabled: !canEdit,
                  onUndo: () => data.remove(latest.id, latest.revision),
                }
              : null
          }
        />
      )}
      {canLog && !auth.isDemoMode && !data.canWrite && !data.pendingOperation && !data.loading && (
        <p className="quiet">
          Cloud logging awaits owner verification and release activation. History preserved.
        </p>
      )}
      {canLog && data.previousYearStatus === 'error' && (
        <p className="quiet" role="status">
          December activity could not be loaded. Check History to review it.
        </p>
      )}
      <ActivitySquares
        unavailableBefore={
          canLog && data.previousYearStatus && data.previousYearStatus !== 'ready'
            ? `${selectedYear}-01-01`
            : undefined
        }
        rolling={canLog}
        onOpenHistory={onHistory}
        key={selectedYear}
        year={selectedYear}
        today={challenge.today}
        byDate={canLog ? { ...data.previousByDate, ...summary.byDate } : summary.byDate}
        records={challenge.yearRecords}
        canEdit={challenge.canLog && data.canWrite}
        busy={busy}
        edit={data.edit}
        remove={data.remove}
      />
    </div>
  );
}
