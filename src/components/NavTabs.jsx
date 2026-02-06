import React from 'react';

export default function NavTabs({ view, views, onChange }) {
  return (
    <div className="flex justify-center -mt-6 relative z-30 mb-8 px-4">
      <div className="nav-tabs">
        <button
          onClick={() => onChange(views.DASHBOARD)}
          className={`nav-tab ${view === views.DASHBOARD ? 'active' : ''}`}
        >
          Log
        </button>
        <button
          onClick={() => onChange(views.STATS)}
          className={`nav-tab ${view === views.STATS ? 'active' : ''}`}
        >
          Stats
        </button>
        <button
          onClick={() => onChange(views.LEADERBOARD)}
          className={`nav-tab ${view === views.LEADERBOARD ? 'active' : ''}`}
        >
          Rank
        </button>
      </div>
    </div>
  );
}
