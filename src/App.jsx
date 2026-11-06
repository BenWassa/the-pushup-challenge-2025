import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useActivityData } from './hooks/useActivityData';
import { useChallenge } from './hooks/useChallenge';
import { createChallengeModel } from './utils/challengeModel';
import { getDemoFixture } from './data/demoFixture';
import Home from './components/home/Home';
import Settings from './components/app/Settings';

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
  // Fictional review data (`?mode=demo&fixture=…`) pins the clock; it never applies outside demo mode.
  const [fixture] = useState(() => (auth.isDemoMode ? getDemoFixture() : null));
  const calendar = useChallenge({ now: fixture?.now });
  const { selectedYear, setSelectedYear } = calendar;
  const data = useActivityData({
    db: auth.db,
    user: auth.accessStatus === 'approved' ? auth.user : null,
    isDemoMode: auth.isDemoMode,
    year: selectedYear,
    timeZone: calendar.timeZone,
    now: fixture?.now,
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
  const [view, setView] = useState('home');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [update, setUpdate] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
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
  // The challenge year is automatic. Past years are read-only and opened from Settings.
  const currentYear = Number(challenge.today.slice(0, 4));
  const openYear = (year) => {
    setSelectedYear(year);
    setView('home');
  };
  const saving = data.saveState === 'saving';
  // Confirmation is acknowledged briefly; pending and failed states stay visible until resolved.
  useEffect(() => {
    if (data.saveState !== 'saved') return undefined;
    const show = setTimeout(() => setSavedToast(true), 0);
    const hide = setTimeout(() => setSavedToast(false), 3200);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      setSavedToast(false);
    };
  }, [data.saveState, data.records]);
  const saveStatus = saving
    ? 'Saving… awaiting confirmation.'
    : data.saveState === 'saved' && savedToast
      ? auth.isDemoMode
        ? 'Saved · demo resets on reload'
        : 'Saved'
      : '';
  const busy = saving || Boolean(data.pendingOperation) || (!online && !auth.isDemoMode);
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
      setUpdateError('Reopen the app to update.');
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
      {!auth.user && (
        <header className="app-header">
          <a className="wordmark" href={import.meta.env.BASE_URL}>
            PushUp
          </a>
        </header>
      )}
      {update && (
        <aside className="notice">
          <p>Update ready. Resolve any pending save first.</p>
          <button disabled={saving || Boolean(data.pendingOperation)} onClick={updateApp}>
            Update app
          </button>
          {updateError && <p role="alert">{updateError}</p>}
        </aside>
      )}
      {auth.isDemoMode && (
        <aside className="demo-note">Demo · resets on reload · no cloud writes</aside>
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
            {!online && !auth.isDemoMode && (
              <p className="notice" role="status">
                Offline. Reconnect to load history or save.
              </p>
            )}
            {data.blockedReason && challenge.canLog && (
              <p className="notice">{data.blockedReason}</p>
            )}
            {data.loading && (
              <p role="status">
                {!online && !auth.isDemoMode
                  ? 'Reconnect to load confirmed sets.'
                  : 'Loading confirmed sets…'}
              </p>
            )}
            {data.legacyHistoryPending && (
              <p className="quiet">
                Earlier records remain in the original archive, pending verified import. Empty years
                here do not mean lost history.
              </p>
            )}
            {challenge.summary.metadataWarnings.length > 0 && (
              <aside className="notice" role="status" aria-label="Activity data review">
                <strong>Activity details need review.</strong>
                <p>
                  {challenge.summary.metadataWarnings.length} saved{' '}
                  {challenge.summary.metadataWarnings.length === 1 ? 'set has' : 'sets have'}{' '}
                  inconsistent phase or timezone details. Progress is calculated using saved dates
                  and the configured challenge calendar. The original records remain unchanged.
                </p>
              </aside>
            )}
            {data.error && (
              <div className="error" role="alert">
                <p>{data.error}</p>
                {data.pendingOperation && (
                  <p>
                    Unconfirmed. Retry this operation to avoid duplicates. Dismissing does not undo
                    a possible save. Check confirmed history before logging it again.
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
            {view === 'home' && (
              <Home
                challenge={challenge}
                data={data}
                auth={auth}
                busy={busy}
                saveStatus={saveStatus}
                records={records}
                latest={latest}
                onAdd={add}
                onSettings={() => setView('settings')}
                onBackToCurrent={() => setSelectedYear(currentYear)}
              />
            )}
            {view === 'settings' && (
              <Settings
                auth={{
                  ...auth,
                  logoutAuth: async () => {
                    await auth.logoutAuth();
                    setView('home');
                  },
                }}
                challenge={challenge}
                busy={saving || Boolean(data.pendingOperation)}
                locked={saving || Boolean(data.pendingOperation)}
                onBack={() => setView('home')}
                onOpenYear={openYear}
              />
            )}
          </>
        )}
      </main>
      <footer>
        <p>Independent tracker. Reps aren’t submitted to The Push-Up Challenge.</p>
        <a href="https://www.thepushupchallenge.ca/how-it-works" target="_blank" rel="noreferrer">
          Event information
        </a>
      </footer>
    </div>
  );
}
