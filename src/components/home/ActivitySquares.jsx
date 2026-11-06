import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ActivityList from '../app/ActivityList.jsx';
import { classifyChallengeDate } from '../../utils/challengeModel.js';
import { getChallenge } from '../../utils/challenges.js';
import {
  buildMonthGrid,
  formatDateLong,
  formatMonthTitle,
  heatLevel,
  moveDate,
} from '../../utils/heatmap.js';
import './ActivitySquares.css';

const PHASE_LABELS = {
  TRAINING: 'Training',
  OFFICIAL: 'Official challenge',
  OFF_SEASON: 'Off-season',
};
const repsLabel = (count) => `${count} ${count === 1 ? 'push-up' : 'push-ups'}`;

// A keyed inner component keeps selection and focus scoped to the displayed year.
export default function ActivitySquares(props) {
  return <MonthActivity key={props.year} {...props} />;
}

function MonthActivity({
  year,
  today,
  byDate = {},
  records = [],
  canEdit,
  busy,
  edit,
  remove,
  initialMonth,
  onSelectedChange,
  onOpenHistory,
}) {
  const todayYear = Number(today.slice(0, 4));
  const lastMonth = todayYear === year ? Number(today.slice(5, 7)) : 12;
  const defaultMonth = initialMonth ?? (todayYear === year ? Number(today.slice(5, 7)) : 2);
  const defaultSelection = (month) => {
    const first = buildMonthGrid(year, month).days[0].date;
    return today.startsWith(first.slice(0, 7)) ? today : first;
  };
  const [selected, setSelected] = useState(() => defaultSelection(defaultMonth));
  const month = Number(selected.slice(5, 7));
  const grid = buildMonthGrid(year, month);
  const buttons = useRef(new Map());
  const focusPending = useRef(false);

  useEffect(() => {
    onSelectedChange?.(selected);
  }, [selected, onSelectedChange]);

  useLayoutEffect(() => {
    if (focusPending.current) {
      buttons.current.get(selected)?.focus();
      focusPending.current = false;
    }
  }, [selected]);

  function navigateMonth(delta) {
    if (month + delta < 1 || month + delta > lastMonth) return;
    setSelected(defaultSelection(month + delta));
  }

  function handleKeyDown(event, date, day) {
    const weekday = (grid.leadingBlanks + day - 1) % 7;
    const offsets = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -weekday,
      End: 6 - weekday,
    };
    let next;
    if (Object.hasOwn(offsets, event.key)) {
      next = moveDate(date, offsets[event.key]);
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      if (onOpenHistory) return;
      const nextMonth = month + (event.key === 'PageUp' ? -1 : 1);
      event.preventDefault();
      if (nextMonth < 1 || nextMonth > lastMonth) return;
      const days = buildMonthGrid(year, nextMonth).days;
      next = days[Math.min(day, days.length) - 1].date;
    } else {
      return;
    }
    event.preventDefault();
    const first = onOpenHistory ? grid.days[0].date : `${year}-01-01`;
    const last = onOpenHistory
      ? grid.days.at(-1).date
      : buildMonthGrid(year, lastMonth).days.at(-1).date;
    next = next < first ? first : next > last ? last : next;
    focusPending.current = next !== selected;
    setSelected(next);
  }

  function dateStatus(date) {
    const classification = classifyChallengeDate(date);
    return [
      // Years without a configured edition (e.g. imported history) are not "off-season".
      classification.phase === 'OFF_SEASON' && !getChallenge(year) && year < todayYear
        ? 'Archive · unclassified'
        : PHASE_LABELS[classification.phase],
      classification.isRestDay === true && 'Rest day',
      date === today && 'Today',
      todayYear === year && date > today && 'Upcoming',
    ].filter(Boolean);
  }

  const total = byDate[selected] ?? 0;
  const selectedRecords = records.filter((record) => record.localDate === selected);

  return (
    <section className="as-root" aria-label="Daily push-up activity">
      <header className="as-header">
        <div className="as-heading">
          <h2 className="as-title">{formatMonthTitle(year, month)}</h2>
        </div>
        {onOpenHistory && (
          <button className="as-history-link" type="button" onClick={onOpenHistory}>
            History
            <ChevronRight className="as-history-chevron" aria-hidden="true" />
          </button>
        )}
        {!onOpenHistory && (
          <div className="as-navigation">
            <button
              className="as-nav"
              type="button"
              aria-label="Previous month"
              disabled={month === 1}
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              className="as-nav"
              type="button"
              aria-label="Next month"
              disabled={month >= lastMonth}
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </header>
      <div className="as-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <span className="as-weekday" key={index} aria-hidden="true">
            {day}
          </span>
        ))}
        {Array.from({ length: grid.leadingBlanks }, (_, index) => (
          <span className="as-blank" key={`blank-${index}`} aria-hidden="true" />
        ))}
        {grid.days.map(({ date, day }) => {
          const count = byDate[date] ?? 0;
          const future = todayYear === year && date > today;
          const label = `${formatDateLong(date)}: ${count ? repsLabel(count) : 'No push-ups recorded'}. ${dateStatus(date).join('. ')}.`;
          return (
            <button
              className={`as-cell${future ? ' as-future' : ''}`}
              key={date}
              type="button"
              ref={(node) => {
                if (node) buttons.current.set(date, node);
                else buttons.current.delete(date);
              }}
              aria-label={label}
              aria-current={date === today ? 'date' : undefined}
              aria-pressed={date === selected}
              tabIndex={date === selected ? 0 : -1}
              onClick={() => setSelected(date)}
              onKeyDown={(event) => handleKeyDown(event, date, day)}
            >
              <span className={`as-square as-heat-${heatLevel(count)}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className="as-legend">
        <span>Less activity</span>
        <span className="as-swatches" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`as-swatch as-heat-${level}`} />
          ))}
        </span>
        <span>More activity</span>
        {todayYear === year && grid.days.some(({ date }) => date > today) && (
          <>
            <span className="as-swatch as-upcoming-swatch" aria-hidden="true" />
            <span>Upcoming</span>
          </>
        )}
      </div>
      <section className="as-detail" aria-live="polite" aria-atomic="true">
        <h3 className="as-date">{formatDateLong(selected)}</h3>
        <p className="as-total">{repsLabel(total)}</p>
        <p className="as-status">{dateStatus(selected).join(' · ')}</p>
        {selectedRecords.length ? (
          <ActivityList
            records={selectedRecords}
            canEdit={canEdit}
            busy={busy}
            edit={edit}
            remove={remove}
          />
        ) : (
          <p className="as-empty">No sets recorded.</p>
        )}
      </section>
    </section>
  );
}
