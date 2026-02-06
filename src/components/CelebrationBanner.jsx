import React from 'react';

export default function CelebrationBanner() {
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-brand-orange text-white px-6 py-4 rounded-lg shadow-lg text-center">
        <p className="font-bold text-lg">🎉 Daily Goal Crushed! 🎉</p>
        <p className="text-sm opacity-90 mt-1">You hit 87 reps today!</p>
      </div>
    </div>
  );
}
