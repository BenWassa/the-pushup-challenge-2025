import { Undo2 } from 'lucide-react';

const AMOUNTS = [1, 10, 20, 25];

/** 2×2 one-tap logging, with undo directly beneath. Saving is a background concern. */
export default function QuickLog({ disabled, onAdd, undo }) {
  return (
    <section className="quick-log" aria-label="Log push-ups">
      <div className="quick-grid" role="group" aria-label="Add push-ups">
        {AMOUNTS.map((amount) => (
          <button
            type="button"
            className="quick-button"
            key={amount}
            disabled={disabled}
            onClick={() => onAdd(amount)}
            aria-label={`Add ${amount} push-ups`}
          >
            +{amount}
          </button>
        ))}
      </div>
      <div className="quick-foot">
        {undo && (
          <button type="button" className="undo" disabled={undo.disabled} onClick={undo.onUndo}>
            <Undo2 size={16} aria-hidden="true" focusable="false" />
            Undo latest set ({undo.amount})
          </button>
        )}
      </div>
    </section>
  );
}
