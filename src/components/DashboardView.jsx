import React from 'react';
import { RotateCcw } from 'lucide-react';
import Button from './Button';
import { formatTime } from '../utils';

export default function DashboardView({
  isTraining,
  addReps,
  isUndoable,
  undoLastAction,
  lastLogAmount,
  recentLogs,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-black">Quick Add</h3>
        <span className="text-xs text-neutral-gray-mid font-medium bg-neutral-gray-lighter px-3 py-1 rounded-full">
          {isTraining ? 'Training Mode' : 'Official Mode'}
        </span>
      </div>

      <div className="logging-grid">
        <Button variant="secondary" size="xl" onClick={() => addReps(1)} className="logging-btn">
          <span className="logging-number text-black">+1</span>
          <span className="logging-label">Single</span>
        </Button>
        <Button variant="secondary" size="xl" onClick={() => addReps(10)} className="logging-btn">
          <span className="logging-number">+10</span>
          <span className="logging-label">Set</span>
        </Button>
        <Button variant="secondary" size="xl" onClick={() => addReps(20)} className="logging-btn">
          <span className="logging-number">+20</span>
          <span className="logging-label">Push</span>
        </Button>
        <Button variant="secondary" size="xl" onClick={() => addReps(25)} className="logging-btn">
          <span className="logging-number">+25</span>
          <span className="logging-label">Big Set</span>
        </Button>
      </div>

      <div className="space-y-4">
        <Button
          variant={isUndoable ? 'danger' : 'ghost'}
          size="sm"
          onClick={undoLastAction}
          disabled={!isUndoable}
          className="w-full flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {isUndoable
            ? `Undo Last (${lastLogAmount > 0 ? '+' : ''}${lastLogAmount})`
            : 'Nothing to Undo'}
        </Button>

        {recentLogs.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="activity-card">
              <h4 className="activity-title">Recent Activity</h4>
              <div className="space-y-2">
                {recentLogs.map((log, i) => (
                  <div key={i} className="activity-item">
                    <span className="activity-time">
                      {log.source === 'historical'
                        ? `${log.submitted_date} (Historical)`
                        : formatTime(log.timestamp)}
                    </span>
                    <span className={`activity-amount ${log.amount > 0 ? 'positive' : 'negative'}`}>
                      {log.amount > 0 ? '+' : ''}
                      {log.amount} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
