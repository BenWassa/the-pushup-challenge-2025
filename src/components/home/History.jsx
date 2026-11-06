import { ArrowLeft } from 'lucide-react';
import ActivitySquares from './ActivitySquares';

export default function History({ challenge, data, busy, onBack }) {
  return (
    <div className="settings history">
      <button type="button" className="back-button" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" />
        Home
      </button>
      <h1 className="screen-title">History</h1>
      <p className="quiet">Browse months and select a day to review its sets.</p>
      <ActivitySquares
        year={challenge.selectedYear}
        today={challenge.today}
        byDate={challenge.summary.byDate}
        records={challenge.yearRecords}
        canEdit={challenge.canLog && data.canWrite}
        busy={busy}
        edit={data.edit}
        remove={data.remove}
      />
    </div>
  );
}
