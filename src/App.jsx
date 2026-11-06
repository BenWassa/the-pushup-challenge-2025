import { useEffect, useState } from 'react';
import { CalendarDays, CircleUserRound, Dumbbell } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useActivityData } from './hooks/useActivityData';
import { useChallenge } from './hooks/useChallenge';
import { createChallengeModel } from './utils/challengeModel';
import ActivityList from './components/app/ActivityList';
import History from './components/app/History';
import Account from './components/app/Account';

const phaseLabel = (phase) =>
  ({ TRAINING: 'Training', OFFICIAL: 'Official challenge', OFF_SEASON: 'Off-season' })[phase];
const displayDate = (date) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

function Tally() {
  // Decorative tally marks: counted sets in accent, the next ones still to come in grey.
  const group = (x, tone) => (
    <g className={tone} key={x}>
      {[6, 18, 30, 42].map((dx) => (
        <line key={dx} x1={x + dx} y1="4" x2={x + dx} y2="44" />
      ))}
      <line x1={x} y1="38" x2={x + 50} y2="10" />
    </g>
  );
  return (
    <svg className="tally" viewBox="0 0 176 48" aria-hidden="true" focusable="false">
      {group(0, 'done')}
      {group(64, 'done')}
      <g className="next">
        <line x1="134" y1="4" x2="134" y2="44" />
        <line x1="146" y1="4" x2="146" y2="44" />
      </g>
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function SignIn({ auth }) {
  return (
    <section className="sign-in" aria-labelledby="sign-in-title">
      <Tally />
      <p className="eyebrow">Your annual push-up journal</p>
      <h1 id="sign-in-title">
        A little stronger,
        <br />
        one set at a time.
      </h1>
      <p className="lede">Sign in to see your personal history and record your next set.</p>
      <div className="sign-in-action">
        <button
          className="google-button"
          disabled={auth.authActionLoading}
          onClick={auth.signInWithGoogle}
        >
          <GoogleMark />
          {auth.authActionLoading ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {auth.authActionError && (
          <p role="alert" className="error">
            {auth.authActionError}
          </p>
        )}
      </div>
      <p className="quiet sign-in-note">
        Private beta: only approved accounts can continue. This independent tracker does not submit
        activity to the organizer.
      </p>
    </section>
  );
}

function AccessPending({ auth }) {
  return (
    <section>
      <h1>You’re not on the list yet</h1>
      <p>
        PushUp is in a private beta. You’re signed in as <strong>{auth.user.email}</strong>, but
        this account hasn’t been approved yet.
      </p>
      <p className="quiet">
        Ask the owner to add this email address, then sign in again. Nothing has been saved or
        shared.
      </p>
      <button onClick={auth.logoutAuth}>Sign out</button>
    </section>
  );
}

export default function App() {
  const auth = useAuth();
  // Preferences and the clock are resolved before subscribing to a year. The pure
  // read model then combines that same calendar context with confirmed records.
  const calendar = useChallenge();
  const { selectedYear, setSelectedYear } = calendar;
  const data = useActivityData({
    db: auth.db,
    user: auth.accessStatus === 'approved' ? auth.user : null,
    isDemoMode: auth.isDemoMode,
    year: selectedYear,
    timeZone: calendar.timeZone,
  });
  const challenge = {
    ...calendar,
    ...createChallengeModel({
      records: data.records,
      year: selectedYear,
      timeZone: calendar.timeZone,
      now: calendar.today,
      availableYears: data.years || [],
    }),
  };
  const [view, setView] = useState('log');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [update, setUpdate] = useState(false);
  const [updateError, setUpdateError] = useState('');
  useEffect(() => {
    const yes = () => setOnline(true);
    const no = () => setOnline(false);
    const available = () => setUpdate(true);
    window.addEventListener('online', yes);
    window.addEventListener('offline', no);
    window.addEventListener('sw-update', available);
    return () => {
      window.removeEventListener('online', yes);
      window.removeEventListener('offline', no);
      window.removeEventListener('sw-update', available);
    };
  }, []);
  // The challenge year is automatic. Other years are history, reached from the History tab.
  const currentYear = Number(challenge.today.slice(0, 4));
  const go = (next) => {
    if (next !== 'history' && selectedYear !== currentYear) setSelectedYear(currentYear);
    setView(next);
  };
  const saving = data.saveState === 'saving';
  const busy = saving || Boolean(data.pendingOperation) || (!online && !auth.isDemoMode);
  const canEdit = challenge.canLog && data.canWrite && !busy;
  const records = [...challenge.yearRecords].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0) || b.id.localeCompare(a.id)
  );
  const latest = records.find((record) => !record.provenance && !record.id.startsWith('legacy_'));
  const updateApp = () => {
    if (saving || data.pendingOperation) return;
    const registration = window.__swRegistration;
    if (!registration?.waiting) {
      window.location.reload();
      return;
    }
    if (!navigator.serviceWorker) {
      setUpdateError('Close and reopen the app to update.');
      return;
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
      once: true,
    });
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };
  const add = (amount) =>
    data.add({
      amount,
      localDate: challenge.today,
      phase: challenge.day.phase,
      challengeYear: selectedYear,
      timeZone: challenge.timeZone,
    });
  return (
    <div className={`app-shell ${auth.user ? 'signed-in' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <a className="wordmark" href={import.meta.env.BASE_URL}>
          PushUp<span>Annual challenge journal</span>
        </a>
        <span className="edition-mark">2027 & beyond</span>
      </header>
      {update && (
        <aside className="notice">
          <p>A new version is ready. Finish or resolve your pending save before updating.</p>
          <button disabled={saving || Boolean(data.pendingOperation)} onClick={updateApp}>
            Update app
          </button>
          {updateError && <p role="alert">{updateError}</p>}
        </aside>
      )}
      {auth.isDemoMode && (
        <aside className="demo-note">
          Fictional demo · changes reset on reload · no cloud writes
        </aside>
      )}
      <main id="main">
        {auth.error ? (
          <section>
            <h1>Connection setup needed</h1>
            <p role="alert">
              Cloud sign-in is not configured for this build. Your existing records have not been
              changed.
            </p>
            <p className="quiet">Contact the app owner to complete release configuration.</p>
          </section>
        ) : auth.loading ? (
          <section aria-busy="true">
            <h1>Opening your journal…</h1>
            <p role="status">Checking your sign-in.</p>
          </section>
        ) : !auth.user ? (
          <SignIn auth={auth} />
        ) : auth.accessStatus === 'pending' ? (
          <AccessPending auth={auth} />
        ) : (
          <>
            <nav className="main-nav" aria-label="Journal">
              {[
                [
                  'log',
                  'Log',
                  <Dumbbell size={22} strokeWidth={2.2} aria-hidden="true" focusable="false" />,
                ],
                [
                  'history',
                  'History',
                  <CalendarDays size={22} strokeWidth={2.2} aria-hidden="true" focusable="false" />,
                ],
                [
                  'account',
                  'Account',
                  <CircleUserRound
                    size={22}
                    strokeWidth={2.2}
                    aria-hidden="true"
                    focusable="false"
                  />,
                ],
              ].map(([id, label, icon]) => (
                <button
                  key={id}
                  aria-current={view === id ? 'page' : undefined}
                  onClick={() => go(id)}
                >
                  <span className="tab-icon">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            {!online && !auth.isDemoMode && (
              <p className="notice" role="status">
                You’re offline. Reconnect to load history or save a set.
              </p>
            )}
            {data.blockedReason && <p className="notice">{data.blockedReason}</p>}
            {data.loading && (
              <p role="status">
                {!online && !auth.isDemoMode
                  ? 'Reconnect to load your confirmed sets.'
                  : 'Loading your confirmed sets…'}
              </p>
            )}
            {data.legacyHistoryPending && (
              <p className="quiet">
                Earlier records are preserved in the original archive and await a verified import.
                An empty year here does not mean your historical activity is lost.
              </p>
            )}
            {challenge.summary.metadataWarnings.length > 0 && (
              <aside className="notice" role="status" aria-label="Activity data review">
                <strong>Some activity details need review.</strong>
                <p>
                  {challenge.summary.metadataWarnings.length} saved{' '}
                  {challenge.summary.metadataWarnings.length === 1 ? 'set has' : 'sets have'}{' '}
                  inconsistent phase or timezone details. Progress is calculated using saved dates
                  and the configured challenge calendar. The original records remain unchanged.
                </p>
              </aside>
            )}
            <div className="save-feedback" aria-live="polite" role="status">
              {saving
                ? 'Saving… Waiting for confirmation.'
                : data.saveState === 'saved'
                  ? auth.isDemoMode
                    ? 'Saved in this demo. Resets on reload.'
                    : 'Saved to your account.'
                  : ''}
            </div>
            {data.error && (
              <div className="error" role="alert">
                <p>{data.error}</p>
                {data.pendingOperation && (
                  <p>
                    This operation has not been confirmed. Retry the same operation to avoid
                    duplicates. Dismissing a retry does not undo a save that may have completed.
                    Check confirmed history before logging that set again.
                  </p>
                )}
                <div className="actions">
                  <button disabled={saving || (!online && !auth.isDemoMode)} onClick={data.retry}>
                    Retry
                  </button>
                  {data.discardPending && data.pendingOperation && (
                    <button disabled={saving} onClick={data.discardPending}>
                      Dismiss retry
                    </button>
                  )}
                </div>
              </div>
            )}
            {view === 'log' && (
              <section aria-labelledby="log-title">
                <div className="hero">
                  <div className="today-heading">
                    <p className="eyebrow">
                      {displayDate(challenge.canLog ? challenge.today : challenge.day.localDate)}
                    </p>
                    <h1 id="log-title">
                      {challenge.canLog ? 'Ready for your next set?' : `${selectedYear} activity`}
                    </h1>
                    <span className="phase-label">{phaseLabel(challenge.day.phase)}</span>
                  </div>
                  {!challenge.canLog && (
                    <p className="notice">
                      This edition is read-only. Select {challenge.today.slice(0, 4)} to record
                      today’s activity.
                    </p>
                  )}
                  {challenge.challenge && (
                    <p className="event-dates">
                      Official challenge: {challenge.challenge.official.start} to{' '}
                      {challenge.challenge.official.end}
                    </p>
                  )}
                  {challenge.challenge && (
                    <p className="quiet">
                      Official daily targets pending. Sundays are confirmed rest days.
                    </p>
                  )}
                  <div className="daily-summary">
                    <div>
                      <span className="quiet">
                        {challenge.canLog
                          ? 'Today’s confirmed push-ups'
                          : 'Confirmed push-ups this year'}
                      </span>
                      <strong>
                        {challenge.canLog ? challenge.summary.todayTotal : challenge.summary.total}
                      </strong>
                    </div>
                    <p>
                      {challenge.day.isRestDay
                        ? 'Rest day. Any activity is optional.'
                        : challenge.day.dailyTarget !== null
                          ? `Daily target: ${challenge.day.dailyTarget}`
                          : challenge.day.phase === 'TRAINING' && challenge.trainingGoal
                            ? `Personal training goal: ${challenge.trainingGoal}`
                            : challenge.day.phase === 'OFFICIAL'
                              ? 'Official daily target pending.'
                              : challenge.day.phase === 'TRAINING'
                                ? 'Training counts separately from the challenge.'
                                : 'Off-season activity stays separate from challenge totals.'}
                    </p>
                  </div>
                </div>
                {challenge.canLog && (
                  <div className="quick-add" aria-label="Add push-ups">
                    {[1, 10, 20, 25].map((amount) => (
                      <button
                        className="quick-button"
                        key={amount}
                        disabled={!canEdit || data.loading}
                        onClick={() => add(amount)}
                        aria-label={`Add ${amount} push-ups`}
                      >
                        +{amount}
                        <span>push-ups</span>
                      </button>
                    ))}
                  </div>
                )}
                {challenge.canLog && latest && (
                  <button
                    className="undo"
                    disabled={!canEdit}
                    onClick={() => data.remove(latest.id, latest.revision)}
                  >
                    Undo latest set ({latest.amount} push-ups)
                  </button>
                )}
                {!auth.isDemoMode && !data.canWrite && !data.pendingOperation && !data.loading && (
                  <p className="quiet">
                    Cloud logging is available only after the owner verifies private access and
                    enables this release. Existing history is preserved.
                  </p>
                )}
                <section className="progress-section" aria-labelledby="progress-title">
                  <h2 id="progress-title">Your {selectedYear} progress</h2>
                  <dl className="totals">
                    <div>
                      <dt>Official challenge</dt>
                      <dd>
                        {challenge.summary.official}
                        {challenge.challenge
                          ? ` / ${challenge.challenge.totalTarget.toLocaleString()}`
                          : ''}
                      </dd>
                    </div>
                    {challenge.challenge && (
                      <div className="progress-row">
                        <dt className="sr-only">Challenge progress</dt>
                        <dd>
                          <div
                            className="progress-track"
                            role="progressbar"
                            aria-label="Official challenge progress"
                            aria-valuemin={0}
                            aria-valuemax={challenge.challenge.totalTarget}
                            aria-valuenow={Math.min(
                              challenge.summary.official,
                              challenge.challenge.totalTarget
                            )}
                            aria-valuetext={`${challenge.summary.official} of ${challenge.challenge.totalTarget} push-ups`}
                          >
                            <span
                              style={{
                                width: `${Math.min(100, (challenge.summary.official / challenge.challenge.totalTarget) * 100)}%`,
                              }}
                            />
                          </div>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Training</dt>
                      <dd>{challenge.summary.training}</dd>
                    </div>
                    <div>
                      <dt>Off-season</dt>
                      <dd>{challenge.summary.offSeason}</dd>
                    </div>
                    {challenge.summary.legacy > 0 && (
                      <div>
                        <dt>Imported history (original classification retained)</dt>
                        <dd>{challenge.summary.legacy}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Active days</dt>
                      <dd>{challenge.summary.activeDays}</dd>
                    </div>
                  </dl>
                </section>
                <section className="recent-section" aria-labelledby="recent-title">
                  <h2 id="recent-title">Recent sets</h2>
                  <ActivityList
                    records={records.slice(0, 10)}
                    canEdit={challenge.canLog && data.canWrite}
                    busy={busy}
                    edit={data.edit}
                    remove={data.remove}
                  />
                  {records.length > 10 && (
                    <button onClick={() => go('history')}>See calendar history</button>
                  )}
                </section>
              </section>
            )}
            {view === 'history' && (
              <History key={selectedYear} challenge={challenge} data={data} busy={busy} />
            )}
            {view === 'account' && (
              <Account
                auth={auth}
                challenge={challenge}
                busy={saving || Boolean(data.pendingOperation)}
              />
            )}
          </>
        )}
      </main>
      <footer>
        <p>
          Independent personal tracker. Activity here is not submitted to The Push-Up Challenge.
        </p>
        <a href="https://www.thepushupchallenge.ca/how-it-works" target="_blank" rel="noreferrer">
          Organizer’s event information
        </a>
      </footer>
    </div>
  );
}
