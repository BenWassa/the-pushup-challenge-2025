import { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
import Account from './Account.jsx';

/** Secondary screen: past years (read-only) and account preferences. */
export default function Settings({ auth, challenge, busy, locked, onBack, onOpenYear }) {
  const [yearInput, setYearInput] = useState('');
  const currentYear = Number(challenge.today.slice(0, 4));
  const pastYears = challenge.years.filter((year) => year !== currentYear);
  return (
    <div className="settings">
      <button type="button" className="back-button" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" focusable="false" />
        Home
      </button>
      <h1 className="screen-title">Settings</h1>
      <section aria-labelledby="past-years-title">
        <h2 id="past-years-title" className="section-title">
          Past years
        </h2>
        <p className="quiet">Earlier challenges open read-only.</p>
        {pastYears.length > 0 && (
          <ul className="year-list">
            {pastYears.map((year) => (
              <li key={year}>
                <button type="button" disabled={locked} onClick={() => onOpenYear(year)}>
                  {year}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Collapsible.Root className="year-jump">
          <Collapsible.Trigger className="year-jump-trigger">
            Another year
            <ChevronDown size={16} aria-hidden="true" focusable="false" />
          </Collapsible.Trigger>
          <Collapsible.Content>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const year = Number(yearInput);
                if (Number.isInteger(year) && year >= 1000 && year <= 9999) {
                  onOpenYear(year);
                  setYearInput('');
                }
              }}
            >
              <label>
                Year
                <input
                  type="number"
                  min="1000"
                  max="9999"
                  required
                  value={yearInput}
                  onChange={(event) => setYearInput(event.target.value)}
                  placeholder="YYYY"
                />
              </label>
              <button disabled={locked}>Open</button>
            </form>
          </Collapsible.Content>
        </Collapsible.Root>
      </section>
      <Account auth={auth} challenge={challenge} busy={busy} />
    </div>
  );
}
