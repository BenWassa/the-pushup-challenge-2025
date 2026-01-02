import React, { useMemo } from "react";
import { getDaysInMonth, getFirstDayOfMonth } from "../utils/date";

// Monthly contribution calendar for the current month.
const ContributionCalendar = ({ logs }) => {
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
    let bgClass = "bg-[#F2F2F2] text-[#858585]";

    if (count > 0) bgClass = "bg-[#FFE4B3] text-[#FFA400] font-bold";
    if (count >= 30) bgClass = "bg-[#FFC966] text-white font-bold";
    if (count >= 70) bgClass = "bg-[#FFA400] text-white font-bold shadow-md transform scale-105";

    days.push(
      <div key={d} className="flex flex-col items-center justify-center mb-2">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${bgClass}`}
          title={`${count} reps`}
        >
          {d}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-[#858585]">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
};

export default ContributionCalendar;
