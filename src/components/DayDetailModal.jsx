import React, { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { getDateString } from '../utils/timestamp';

const DayDetailModal = ({ isOpen, selectedDate, logs, onClose, onAddHistorical, onDeleteLog }) => {
  const [histAmount, setHistAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !selectedDate) return null;

  const dateStr = getDateString(selectedDate);
  const dayLogs = logs.filter((log) => {
    // Handle both real-time (timestamp) and historical (submitted_date) logs
    if (log.source === 'historical' && log.submitted_date) {
      return log.submitted_date === dateStr;
    }
    const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp;
    return logDate && getDateString(logDate) === dateStr;
  });

  const totalReps = dayLogs.reduce((sum, log) => sum + log.amount, 0);
  const historicalLogs = dayLogs.filter((log) => log.source === 'historical');
  const realtimeLogs = dayLogs.filter((log) => log.source !== 'historical');

  const handleAddHistorical = async () => {
    setError('');
    const amount = parseInt(histAmount, 10);

    if (!amount || amount <= 0) {
      setError('Enter a positive number');
      return;
    }

    if (amount > 5000) {
      setError('That seems too high. Max 5000 reps per entry.');
      return;
    }

    try {
      await onAddHistorical(selectedDate, amount);
      setHistAmount('');
    } catch (err) {
      setError(err.message || 'Failed to add historical data');
    }
  };

  const handleDeleteLog = async (logId, logAmount) => {
    if (window.confirm(`Delete ${logAmount} reps? This can't be undone.`)) {
      try {
        await onDeleteLog(logId);
      } catch (err) {
        setError(err.message || 'Failed to delete log');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 border-b border-orange-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Total for this day</p>
            <p className="text-3xl font-bold text-brand-orange">{totalReps}</p>
            <p className="text-gray-600 text-xs mt-1">reps logged</p>
          </div>
        </div>

        {/* Logs Section */}
        <div className="p-4">
          {dayLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No logs for this date</p>
          ) : (
            <div className="space-y-3 mb-6">
              {/* Real-time logs */}
              {realtimeLogs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Real-time logs
                  </h3>
                  <div className="space-y-2">
                    {realtimeLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{log.amount} reps</p>
                          <p className="text-xs text-gray-500">
                            {log.timestamp?.toDate
                              ? log.timestamp.toDate().toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  meridiem: 'short',
                                })
                              : 'Time unavailable'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteLog(idx, log.amount)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          aria-label="Delete log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical logs */}
              {historicalLogs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Historical entries
                  </h3>
                  <div className="space-y-2">
                    {historicalLogs.map((log, idx) => (
                      <div
                        key={`hist-${idx}`}
                        className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{log.amount} reps</p>
                          <p className="text-xs text-gray-500">Historical entry</p>
                        </div>
                        <button
                          onClick={() => handleDeleteLog(idx, log.amount)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          aria-label="Delete log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Historical Entry Form */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add historical entry
            </h3>

            {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="5000"
                step="1"
                value={histAmount}
                onChange={(e) => {
                  setHistAmount(e.target.value);
                  setError('');
                }}
                placeholder="Number of reps"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
              <button
                onClick={handleAddHistorical}
                disabled={!histAmount || parseInt(histAmount, 10) <= 0}
                className="px-4 py-2 bg-brand-orange text-white rounded-lg font-medium hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use this to log workouts from past days that you didn't record in the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
