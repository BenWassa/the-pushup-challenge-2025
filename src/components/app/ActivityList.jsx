import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { classifyChallengeDate } from '../../utils/challengeModel.js';

function reportingLabel(record) {
  const phase = classifyChallengeDate(record.localDate).phase;
  if (record.provenance && phase === 'OFF_SEASON') return 'History · unclassified';
  return phase === 'OFFICIAL' ? 'Challenge' : phase === 'TRAINING' ? 'Training' : 'Off-season';
}

export default function ActivityList({ records, canEdit, busy, edit, remove }) {
  const [editing, setEditing] = useState(null);
  const [editRevision, setEditRevision] = useState(null);
  const [amount, setAmount] = useState('');
  const [removing, setRemoving] = useState(null);
  const [removeRevision, setRemoveRevision] = useState(null);
  if (!records.length) return <p className="quiet">No confirmed sets yet.</p>;
  return (
    <ul className="activity-list">
      {records.map((record) => (
        <li key={record.id}>
          <div className="set-description">
            <strong>{record.amount}</strong>
            {record.provenance && <span>Imported · read-only</span>}
            <span>
              {record.localDate} · {reportingLabel(record)}
            </span>
          </div>
          {canEdit &&
            !record.provenance &&
            !record.id.startsWith('legacy_') &&
            editing !== record.id &&
            removing !== record.id && (
              <div className="actions">
                <button
                  disabled={busy}
                  onClick={() => {
                    setEditing(record.id);
                    setEditRevision(record.revision);
                    setAmount(String(record.amount));
                  }}
                >
                  <Pencil size={18} aria-hidden="true" focusable="false" />
                  <span className="sr-only">
                    Edit set of {record.amount} on {record.localDate}
                  </span>
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    setRemoving(record.id);
                    setRemoveRevision(record.revision);
                  }}
                >
                  <Trash2 size={18} aria-hidden="true" focusable="false" />
                  <span className="sr-only">
                    Remove set of {record.amount} on {record.localDate}
                  </span>
                </button>
              </div>
            )}
          {editing === record.id && (
            <form
              className="inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const result = await edit(record.id, Number(amount), editRevision);
                if (result !== false) setEditing(null);
              }}
            >
              <label>
                Push-ups
                <input
                  autoFocus
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <div className="actions">
                <button className="primary" disabled={busy}>
                  Save
                </button>
                <button type="button" disabled={busy} onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {removing === record.id && (
            <div className="inline-form">
              <p>Remove {record.amount}-push-up set?</p>
              <div className="actions">
                <button
                  autoFocus
                  className="danger"
                  disabled={busy}
                  onClick={async () => {
                    const result = await remove(record.id, removeRevision);
                    if (result !== false) setRemoving(null);
                  }}
                >
                  Remove set
                </button>
                <button disabled={busy} onClick={() => setRemoving(null)}>
                  Keep
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
