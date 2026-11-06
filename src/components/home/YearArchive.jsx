import { centuryState, slotPlan, CENTURY } from '../../utils/century.js';
import { bestDay } from '../../utils/archive.js';
import {
  buildMonthGrid,
  formatDateLong,
  formatMonthTitle,
  heatLevel,
} from '../../utils/heatmap.js';
import '../../styles/archive.css';

export default function YearArchive({ challenge, onBackToCurrent, onSettings, onHistory }) {
  const { selectedYear: year, summary } = challenge;
  const best = bestDay(summary.byDate);
  const blocks = Math.floor(summary.total / CENTURY);
  const state = centuryState({ total: summary.total, compacted: blocks });
  const plan = slotPlan({ blocks: state.blocks, compacted: state.compacted });
  const shown = Math.min(blocks, plan.hasMore ? plan.count - 1 : plan.count);
  const categories = [
    ['Official', summary.official],
    ['Training', summary.training],
    ['Off-season', summary.offSeason],
    ['Imported', summary.legacy],
  ];
  return (
    <div className="year-archive">
      <button type="button" className="back-button" onClick={onBackToCurrent}>
        Back to {challenge.today.slice(0, 4)}
      </button>
      <header>
        <h1>{year}</h1>
        <p className="quiet">Archive, read-only</p>
      </header>
      <p className="archive-total" data-testid="archive-total">
        <strong>{summary.total.toLocaleString()}</strong>
        <span>Confirmed push-ups</span>
      </p>
      <section aria-labelledby="archive-breakdown">
        <h2 id="archive-breakdown">Year breakdown</h2>
        <dl className="archive-ledger">
          {categories
            .filter(([, value]) => value > 0)
            .map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {value.toLocaleString()}
                  {label === 'Official' && challenge.challenge?.totalTarget
                    ? ` / ${challenge.challenge.totalTarget.toLocaleString()}`
                    : ''}
                </dd>
              </div>
            ))}
          <div>
            <dt>Active days</dt>
            <dd>{summary.activeDays.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Best day</dt>
            <dd>
              {best ? (
                <>
                  {best.total.toLocaleString()} push-ups<small>{formatDateLong(best.date)}</small>
                </>
              ) : (
                'No activity recorded'
              )}
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="archive-hundreds">
        <h2 id="archive-hundreds">Finished hundreds</h2>
        <p className="quiet">{blocks.toLocaleString()} × 100 push-ups</p>
        {blocks > 0 && (
          <div role="img" aria-label={`${blocks} finished hundreds`}>
            <ol className="archive-bricks" aria-hidden="true">
              {Array.from({ length: shown }, (_, index) => (
                <li key={index} />
              ))}
            </ol>
            {plan.hasMore && (
              <p aria-hidden="true" className="quiet">
                +{plan.hiddenCount.toLocaleString()} hundreds
              </p>
            )}
          </div>
        )}
      </section>
      <section aria-labelledby="archive-activity">
        <h2 id="archive-activity">Year activity</h2>
        <div className="archive-months">
          {Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const title = formatMonthTitle(year, month);
            const days = buildMonthGrid(year, month).days;
            const total = days.reduce((sum, { date }) => sum + (summary.byDate[date] ?? 0), 0);
            return (
              <div
                className="archive-month"
                key={month}
                role="img"
                aria-label={`${title}: ${total} push-ups`}
              >
                <span aria-hidden="true">{title.split(' ')[0].slice(0, 3)}</span>
                <div className="archive-days" aria-hidden="true">
                  {days.map(({ date }) => (
                    <span
                      key={date}
                      style={{ background: `var(--heat-${heatLevel(summary.byDate[date] ?? 0)})` }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <button type="button" onClick={onHistory}>
        Open {year} History
      </button>
      <button type="button" className="link-button" onClick={onSettings}>
        Settings
      </button>
    </div>
  );
}
