import { useState } from 'react';

export default function Account({ auth, challenge, busy }) {
  const [zone, setZone] = useState(challenge.timeZone);
  const [goal, setGoal] = useState(challenge.trainingGoal ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <section aria-labelledby="account-title">
      <h2 id="account-title">Account & preferences</h2>
      <p>{auth.isDemoMode ? 'Fictional demo participant' : auth.user?.email}</p>
      <p className="quiet">
        Preferences stay on this device. Existing sets keep their original calendar date and
        timezone.
      </p>
      <form
        className="preferences"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            new Intl.DateTimeFormat(undefined, { timeZone: zone });
            challenge.setTimeZone(zone);
            challenge.setTrainingGoal(goal === '' ? null : Number(goal));
            setError('');
            setMessage('Preferences saved on this device.');
          } catch {
            setError('Enter a valid IANA timezone, such as America/Toronto.');
            setMessage('');
          }
        }}
      >
        <label>
          Timezone
          <input list="timezones" value={zone} required onChange={(e) => setZone(e.target.value)} />
          <datalist id="timezones">
            {[
              'America/Toronto',
              'America/Vancouver',
              'America/Edmonton',
              'America/Winnipeg',
              'America/Halifax',
              'America/St_Johns',
              'UTC',
            ].map((z) => (
              <option value={z} key={z} />
            ))}
          </datalist>
        </label>
        <label>
          Personal daily training goal (optional)
          <input
            type="number"
            min="1"
            max="10000"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </label>
        <p className="quiet">This personal goal never replaces the organizer’s official target.</p>
        <button className="primary" disabled={busy}>
          Save preferences
        </button>
      </form>
      <p role="status">{message}</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {auth.isDemoMode ? (
        <div className="notice">
          <p>
            Demo sets exist only in memory and reset on reload. No Firebase records are read or
            written.
          </p>
          <button disabled={busy} onClick={() => window.location.reload()}>
            Reset fictional demo
          </button>
        </div>
      ) : (
        <button
          disabled={busy}
          onClick={async () => {
            try {
              await auth.logoutAuth();
            } catch {
              setError('Could not sign out. Please try again.');
            }
          }}
        >
          Sign out
        </button>
      )}
    </section>
  );
}
