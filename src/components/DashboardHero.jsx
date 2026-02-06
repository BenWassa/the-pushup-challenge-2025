import React from 'react';
import { Activity, Trophy } from 'lucide-react';

export default function DashboardHero({
  isTraining,
  heroLabel,
  heroCurrent,
  heroGoal,
  official_reps,
  challengeGoal,
  onLogout,
}) {
  const chunks = 4;
  const safeGoal = heroGoal > 0 ? heroGoal : 1;
  const chunkSize = safeGoal / chunks;
  const chunkFills = Array.from({ length: chunks }, (_, index) => {
    const start = index * chunkSize;
    const progress = (heroCurrent - start) / chunkSize;
    return Math.max(0, Math.min(1, progress));
  });
  const labelValues = Array.from({ length: chunks + 1 }, (_, index) =>
    Math.round((safeGoal / chunks) * index),
  );

  return (
    <div className="bg-[radial-gradient(circle_at_50%_0%,_#F0F2F5_0%,_#D1D5DB_100%)] pt-8 pb-12 px-6 rounded-b-leaf relative overflow-hidden">
      <div className="relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-neutral-gray-mid text-sm font-bold uppercase tracking-widest mb-1">
              Current Season
            </h2>
            <div className="flex items-center gap-2">
              {isTraining ? (
                <Activity className="w-5 h-5 text-neutral-gray-text" />
              ) : (
                <Trophy className="w-5 h-5 text-brand-orange" />
              )}
              <h1 className={`text-2xl font-bold ${isTraining ? 'text-black' : 'text-brand-orange'}`}>
                {isTraining ? 'Training Camp' : 'The Challenge'}
              </h1>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs font-bold text-neutral-gray-mid underline">
            Sign Out
          </button>
        </div>

        <div className="rounded-[28px] bg-white/65 backdrop-blur-xl border border-white/80 p-7 shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(255,255,255,0.5)]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8E8E93] block mb-3">
            {heroLabel}
          </span>

          <div className="flex items-end justify-between mb-6">
            <span className="text-[68px] font-extrabold leading-[0.85] tracking-[-0.03em] bg-gradient-to-br from-[#FF5500] via-[#FF9F0A] to-[#FF5500] bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(255,85,0,0.15)]">
              {heroCurrent}
            </span>
          </div>

          <div className="mb-5">
            <div className="flex gap-2 h-8 w-full">
              {chunkFills.map((fillAmount, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-md overflow-hidden bg-black/5"
                  style={{ transform: 'skewX(-10deg)' }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#FF9F0A] to-[#FF5500] shadow-[0_0_10px_rgba(255,164,0,0.4)]"
                    style={{
                      width: `${Math.round(fillAmount * 100)}%`,
                      transform: 'skewX(10deg)',
                      transformOrigin: 'left',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] font-bold uppercase text-[#999] px-1">
              {labelValues.map((value, index) => {
                const isActive = heroCurrent >= value;
                return (
                  <span key={value} className={isActive ? 'text-[#FF5500]' : ''}>
                    {index === 0 ? 'Start' : value}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="border-t border-black/5 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8E8E93]">
                Challenge Progress
              </span>
              <span className="text-[11px] font-semibold text-[#8E8E93]">
                {official_reps} / {challengeGoal}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-black/10 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-[#AEAEB2]"
                style={{ width: `${Math.round((official_reps / challengeGoal) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
