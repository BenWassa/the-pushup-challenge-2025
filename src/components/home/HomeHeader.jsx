import { Settings } from 'lucide-react';
import BrandMark from './BrandMark.jsx';

// "Equipment label" patch: one type size for every phase, split over two lines without hyphens.
const PATCHES = {
  Official: { key: 'competition', name: 'Competition', lines: ['COMPE', 'TITION'] },
  Training: { key: 'training', name: 'Training', lines: ['TRAIN', 'ING'] },
  'Off-season': { key: 'off-season', name: 'Off season', lines: ['OFF', 'SEASON'] },
};
const ARCHIVE = { key: 'archive', name: 'Archive, read-only', lines: ['READ', 'ONLY'] };

/** Compact masthead: identity, the current phase as a label patch, quiet settings access. */
export default function HomeHeader({ year, phaseLabel, onSettings }) {
  const patch = PATCHES[phaseLabel] ?? ARCHIVE;
  return (
    <header className="home-header">
      <div className="home-header-top">
        <h1 className="brand-heading" aria-label={`PushUp ${year}`}>
          <BrandMark year={year} />
        </h1>
        <div className={`phase-patch is-${patch.key}`} data-testid="phase-patch">
          <span className="patch-kicker" aria-hidden="true">
            {patch.key === 'archive' ? 'YEAR ARCHIVE' : 'CURRENT PHASE'}
          </span>
          <span className="sr-only">
            {patch.key === 'archive'
              ? 'Viewing a past year, read-only'
              : `Current phase: ${patch.name}`}
          </span>
          <strong className="patch-name" aria-hidden="true">
            {patch.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </strong>
          <span className="patch-foot" aria-hidden="true">
            {year} EDITION
          </span>
        </div>
        <button type="button" className="icon-button" onClick={onSettings} aria-label="Settings">
          <Settings size={20} strokeWidth={2} aria-hidden="true" focusable="false" />
        </button>
      </div>
    </header>
  );
}
