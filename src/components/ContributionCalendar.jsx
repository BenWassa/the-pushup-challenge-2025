import React, { useMemo } from 'react';
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/date';

// Monthly contribution calendar for the current month.
const ContributionCalendar = ({ logs, onDateClick }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const dailyData = useMemo(() => {
    const data = {};
    if (!logs) return data;

    logs.forEach((log) => {
      if (!log.timestamp) return;
      const date = new Date(log.timestamp.toDate ? log.timestamp.toDate() : log.timestamp);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        data[day] = (data[day] || 0) + log.amount;
      }
    });
    return data;
  }, [logs, currentMonth, currentYear]);

  const days = [];
  for (let i = 0; i < firstDay; i += 1) {
    days.push(<div key={`pad-${i}`} className="h-10 w-10" />);
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    const count = dailyData[d] || 0;
    let level = 0;
    if (count > 0) level = 1;
    if (count >= 30) level = 2;
    if (count >= 70) level = 3;

    const clickDate = new Date(currentYear, currentMonth, d);

    days.push(
      <div key={d} className="flex flex-col items-center justify-center mb-2">
        <div
          onClick={() => onDateClick?.(clickDate)}
          className={`calendar-day calendar-day-${level} cursor-pointer hover:ring-2 hover:ring-brand-orange transition-all`}
          title={`${count} reps`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onDateClick?.(clickDate);
            }
          }}
        >
          {d}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar">
      <div className="calendar-labels">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="calendar-label">
            {d}
          </span>
        ))}
      </div>
      <div className="calendar-grid">{days}</div>
    </div>
  );
};

export default ContributionCalendar;
