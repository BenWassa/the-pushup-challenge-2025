import { useState } from 'react';

export default function Account({ auth, challenge, busy }) {
  const [zone, setZone] = useState(challenge.timeZone);
  const [goal, setGoal] = useState(challenge.trainingGoal ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <section aria-labelledby="account-title">
      <h2 id="account-title">Account</h2>
      <p>{auth.isDemoMode ? 'Demo participant' : auth.user?.email}</p>
      <p className="quiet">Device-only preferences. Saved dates and timezones stay unchanged.</p>
      <form
        className="preferences"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            new Intl.DateTimeFormat(undefined, { timeZone: zone });
            challenge.setTimeZone(zone);
            challenge.setTrainingGoal(goal === '' ? null : Number(goal));
            setError('');
            setMessage('Saved on this device.');
          } catch {
            setError('Use a timezone like America/Toronto.');
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
          Daily training goal (optional)
          <input
            type="number"
            min="1"
            max="10000"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </label>
        <p className="quiet">Personal goal; official target unchanged.</p>
        <button className="primary" disabled={busy}>
          Save
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
          <p>Demo: memory only; resets on reload. No Firebase reads or writes.</p>
          <button disabled={busy} onClick={() => window.location.reload()}>
            Reset demo
          </button>
        </div>
      ) : (
        <button
          disabled={busy}
          onClick={async () => {
            try {
              await auth.logoutAuth();
            } catch {
              setError('Sign-out failed. Try again.');
            }
          }}
        >
          Sign out
        </button>
      )}
    </section>
  );
}
