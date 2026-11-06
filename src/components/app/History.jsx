import { useState } from 'react';
import ActivityList from './ActivityList';

const monthLabel = (month) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
export default function History({ challenge, data, busy }) {
  const { selectedYear, today, yearRecords, summary, canLog } = challenge;
  const [chosenMonth, setChosenMonth] = useState(
    canLog ? today.slice(5, 7) : challenge.challenge?.official.start.slice(5, 7) || '01'
  );
  const [selected, setSelected] = useState(null);
  const [yearInput, setYearInput] = useState('');
  const currentYear = Number(today.slice(0, 4));
  const locked = data.saveState === 'saving' || Boolean(data.pendingOperation);
  const month = `${selectedYear}-${chosenMonth}`;
  const days = new Date(Date.UTC(selectedYear, Number(chosenMonth), 0)).getUTCDate();
  const offset = new Date(`${month}-01T12:00:00Z`).getUTCDay();
  const selectedDate = selected?.startsWith(month)
    ? selected
    : today.startsWith(month)
      ? today
      : `${month}-01`;
  const records = yearRecords.filter((r) => r.localDate === selectedDate);
  return (
    <section aria-labelledby="history-title">
      <div className="year-bar">
        <label>
          Challenge year
          <select
            aria-label="Challenge year"
            value={selectedYear}
            onChange={(e) => challenge.setSelectedYear(Number(e.target.value))}
            disabled={locked}
          >
            {challenge.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <span className="year-state">
          {selectedYear === currentYear ? 'Current year' : 'Read-only edition'}
        </span>
      </div>
      <details className="year-jump">
        <summary>Open another year</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const year = Number(yearInput);
            if (Number.isInteger(year) && year >= 1000 && year <= 9999) {
              challenge.setSelectedYear(year);
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
          <button disabled={locked}>Open year</button>
        </form>
      </details>
      <div className="section-heading">
        <h2 id="history-title">History</h2>
        <label className="compact-label">
          Month
          <select
            value={chosenMonth}
            onChange={(e) => {
              setChosenMonth(e.target.value);
              setSelected(null);
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>
                {new Date(2027, i, 1).toLocaleDateString(undefined, { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>
        {monthLabel(month)} · {summary.activeDays} active days this year
      </p>
      <div className="calendar-grid" aria-label={monthLabel(month)}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span className="weekday" key={d} aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, '0')}`;
          const count = summary.byDate[date] || 0;
          return (
            <button
              type="button"
              key={date}
              className={`calendar-cell ${count ? 'has-reps' : ''} ${count >= 100 ? 'activity-high' : count >= 40 ? 'activity-medium' : count > 0 ? 'activity-low' : ''} ${(offset + i) % 7 === 0 ? 'rest-day' : ''}`}
              aria-pressed={selectedDate === date}
              aria-current={today === date ? 'date' : undefined}
              onClick={() => setSelected(date)}
            >
              <span className="sr-only">Day </span>
              <span>{i + 1}</span>
              <small>{count}</small>
              <span className="sr-only"> push-ups on {date}</span>
            </button>
          );
        })}
      </div>
      <div className="day-detail" aria-live="polite">
        <h3>{selectedDate}</h3>
        <p>{records.reduce((n, r) => n + r.amount, 0)} confirmed push-ups</p>
      </div>
      <ActivityList
        records={records}
        canEdit={canLog && data.canWrite}
        busy={busy}
        edit={data.edit}
        remove={data.remove}
      />
      {!canLog && (
        <p className="notice">
          This edition is read-only. Return to the current year to log a set.
        </p>
      )}
    </section>
  );
}
