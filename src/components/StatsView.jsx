import React from 'react';
import { Calendar, Flame, TrendingUp } from 'lucide-react';
import Card from './Card';
import ContributionCalendar from './ContributionCalendar';

export default function StatsView({
  currentMonthLabel,
  userLogs,
  onDateClick,
  calculateStreak,
  isTraining,
  training_reps,
  official_reps,
}) {
  const activeDays = calculateStreak();
  const avgReps =
    activeDays > 0 ? Math.round((isTraining ? training_reps : official_reps) / activeDays) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-black">Consistency</h3>
        <div className="flex gap-1 text-[10px] text-neutral-gray-mid font-bold uppercase items-center">
          <span>{currentMonthLabel}</span>
          <Calendar className="w-3 h-3 ml-1" />
        </div>
      </div>

      <Card variant="soft" className="bg-white">
        <ContributionCalendar logs={userLogs} onDateClick={onDateClick} />
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-100" />
            <span className="text-xs text-neutral-gray-mid">Some</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-200" />
            <span className="text-xs text-neutral-gray-mid">Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-orange" />
            <span className="text-xs text-neutral-gray-mid">Great</span>
          </div>
        </div>
      </Card>

      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <Flame className="w-4 h-4 text-brand-orange" />
            Active Days
          </div>
          <span className="stats-value">{activeDays}</span>
        </div>
        <div className="stats-card">
          <div className="stats-header">
            <TrendingUp className="w-4 h-4 text-brand-orange" />
            Avg Reps
          </div>
          <span className="stats-value">{avgReps}</span>
        </div>
      </div>
    </div>
  );
}
