import React from "react";

// Simple progress bar with label and totals.
const ProgressBar = ({ current = 0, total = 100, label, subLabel, colorClass = "bg-[#FFA400]" }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="text-4xl font-bold block leading-none">{current}</span>
          <span className="text-xs text-[#5C5C5C] uppercase tracking-wider font-semibold">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-[#5C5C5C] block">{total}</span>
          <span className="text-xs text-[#5C5C5C]">{subLabel}</span>
        </div>
      </div>
      <div className="h-4 w-full bg-[#F2F2F2] rounded-full overflow-hidden relative">
        <div
          className={`h-full ${colorClass} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
