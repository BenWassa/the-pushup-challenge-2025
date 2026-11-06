// Loading placeholder with the same silhouette as Home, so content replaces it without layout shift.
// Styles live in index.html (critical boot CSS) so the identical shell paints before any JS runs.
import wordmark from '../../assets/brand/pushup-wordmark.webp';

export default function HomeSkeleton({ label = 'Opening your journal…' }) {
  return (
    <div className="boot-skeleton" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className="boot-head">
          <img className="boot-word" src={wordmark} width="320" height="147" alt="" />
          <span className="boot-block boot-gear" />
        </div>
        <div className="boot-block boot-meta" />
        <div className="boot-block boot-label" />
        <div className="boot-block boot-total" />
        <div className="boot-block boot-bar" />
        <div className="boot-grid">
          <span className="boot-block boot-key" />
          <span className="boot-block boot-key" />
          <span className="boot-block boot-key" />
          <span className="boot-block boot-key" />
        </div>
      </div>
    </div>
  );
}
