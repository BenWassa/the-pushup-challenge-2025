import { ArrowLeft } from 'lucide-react';
import HomeHeader from './HomeHeader.jsx';
import ProgressSummary from './ProgressSummary.jsx';
import QuickLog from './QuickLog.jsx';
import ActivitySquares from './ActivitySquares.jsx';
import { computeStreak } from '../../utils/streak.js';

const phaseLabel = (phase) =>
  ({ TRAINING: 'Training', OFFICIAL: 'Official', OFF_SEASON: 'Off-season' })[phase];
const displayDate = (date) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

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
  const canEdit = challenge.canLog && data.canWrite && !busy;
  const primary = canLog
    ? {
        value: summary.todayTotal,
        note: dayNote(challenge),
      }
    : { label: `${selectedYear} · confirmed`, value: summary.total };
  const official = challenge.challenge
    ? { value: summary.official, target: challenge.challenge.totalTarget }
    : null;
  const streak =
    canLog && challenge.day.phase === 'OFFICIAL'
      ? computeStreak(summary.byDate, challenge.today)
      : 0;
  const others = [
    ['Training', summary.training],
    ['Off-season', summary.offSeason],
    ...(summary.legacy > 0 ? [['Imported', summary.legacy]] : []),
    ['Active days', summary.activeDays],
  ];
  return (
    <div className="home">
      <HomeHeader
        year={selectedYear}
        dateLabel={canLog ? displayDate(challenge.today) : ''}
        phaseLabel={canLog ? phaseLabel(challenge.day.phase) : 'Archive · read-only'}
        onSettings={onSettings}
      />
      {!canLog && (
        <p className="archive-banner">
          <span>Viewing {selectedYear} · read-only</span>
          <button type="button" className="link-button" onClick={onBackToCurrent}>
            <ArrowLeft size={16} aria-hidden="true" focusable="false" />
            Back to {challenge.today.slice(0, 4)}
          </button>
        </p>
      )}
      <ProgressSummary primary={primary} official={official} streak={streak} />
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
      <ActivitySquares
        onOpenHistory={onHistory}
        key={selectedYear}
        year={selectedYear}
        today={challenge.today}
        byDate={summary.byDate}
        records={challenge.yearRecords}
        canEdit={challenge.canLog && data.canWrite}
        busy={busy}
        edit={data.edit}
        remove={data.remove}
      />
      <section className="breakdown" aria-label={`${selectedYear} breakdown`}>
        <dl>
          {others.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
