import React from 'react';
import { X } from 'lucide-react';
import { getDateString } from '../utils/timestamp';

const DaySummaryPopup = ({ isOpen, selectedDate, logs, onClose }) => {
  if (!isOpen || !selectedDate) return null;

  const dateStr = getDateString(selectedDate);
  const dateIsoStr = selectedDate.toISOString().split('T')[0];

  const dayLogs = logs.filter((log) => {
    if (log.source === 'historical' && log.submitted_date) {
      return log.submitted_date === dateIsoStr;
    }
    if (log.timestamp) {
      const logDate = log.timestamp.toDate ? log.timestamp.toDate() : log.timestamp;
      return logDate && getDateString(logDate) === dateStr;
    }
    return false;
  });

  const totalReps = dayLogs.reduce((sum, log) => sum + log.amount, 0);

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs mx-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-gray-mid">
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-4xl font-extrabold text-brand-orange mt-2">{totalReps}</p>
            <p className="text-xs text-neutral-gray-mid mt-1">pushups logged</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close popup"
          >
            <X className="w-4 h-4 text-neutral-gray-mid" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DaySummaryPopup;
