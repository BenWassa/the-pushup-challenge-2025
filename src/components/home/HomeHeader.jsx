import { Settings } from 'lucide-react';
import BrandMark from './BrandMark.jsx';

/** Compact masthead: identity, today's date and phase, quiet settings access. */
export default function HomeHeader({ year, dateLabel, phaseLabel, onSettings }) {
  return (
    <header className="home-header">
      <div className="home-header-top">
        <h1 className="brand-heading" aria-label={`PushUp ${year}`}>
          <BrandMark year={year} />
        </h1>
        <button type="button" className="icon-button" onClick={onSettings} aria-label="Settings">
          <Settings size={20} strokeWidth={2} aria-hidden="true" focusable="false" />
        </button>
      </div>
      <p className="home-header-meta">
        {dateLabel && <span>{dateLabel}</span>}
        <span className="phase-chip">{phaseLabel}</span>
      </p>
    </header>
  );
}
