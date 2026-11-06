import { useState } from 'react';
import { classifyChallengeDate } from '../../utils/challengeModel.js';

function reportingLabel(record) {
  const phase = classifyChallengeDate(record.localDate).phase;
  if (record.provenance && phase === 'OFF_SEASON') return 'Historical activity (unclassified)';
  return phase === 'OFFICIAL' ? 'Challenge' : phase === 'TRAINING' ? 'Training' : 'Off-season';
}

export default function ActivityList({ records, canEdit, busy, edit, remove }) {
  const [editing, setEditing] = useState(null);
  const [amount, setAmount] = useState('');
  const [removing, setRemoving] = useState(null);
  if (!records.length)
    return <p className="quiet">No sets here yet. Your confirmed sets will appear here.</p>;
  return (
    <ul className="activity-list">
      {records.map((record) => (
        <li key={record.id}>
          <div className="set-description">
            <strong>{record.amount} push-ups</strong>
            {record.provenance && <span>Imported history · read-only</span>}
            <span>
              {record.localDate} ·{' '}
              {reportingLabel(record)}
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
                    setAmount(String(record.amount));
                  }}
                >
                  Edit
                  <span className="sr-only">
                    {' '}
                    set of {record.amount} on {record.localDate}
                  </span>
                </button>
                <button disabled={busy} onClick={() => setRemoving(record.id)}>
                  Remove
                  <span className="sr-only">
                    {' '}
                    set of {record.amount} on {record.localDate}
                  </span>
                </button>
              </div>
            )}
          {editing === record.id && (
            <form
              className="inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const result = await edit(record.id, Number(amount));
                if (result !== false) setEditing(null);
              }}
            >
              <label>
                Push-ups
                <input
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
                  Save correction
                </button>
                <button type="button" disabled={busy} onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {removing === record.id && (
            <div className="inline-form">
              <p>Remove this {record.amount} push-up set?</p>
              <div className="actions">
                <button
                  className="danger"
                  disabled={busy}
                  onClick={async () => {
                    const result = await remove(record.id);
                    if (result !== false) setRemoving(null);
                  }}
                >
                  Confirm removal
                </button>
                <button disabled={busy} onClick={() => setRemoving(null)}>
                  Keep set
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
