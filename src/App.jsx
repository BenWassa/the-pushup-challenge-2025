import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Trophy, Calendar, Flame, TrendingUp, RotateCcw } from 'lucide-react';
import Button from './components/Button';
import Card from './components/Card';
import ProgressBar from './components/ProgressBar';
import ContributionCalendar from './components/ContributionCalendar';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import { useLeaderboard } from './hooks/useLeaderboard';
import { formatTime, getSeason } from './utils';

const VIEWS = {
  DASHBOARD: 'dashboard',
  STATS: 'stats',
  LEADERBOARD: 'leaderboard',
};

export default function App() {
  const { user, loading: loadingAuth, db, appId, error: authError } = useAuth();
  const season = getSeason();
  const isTraining = season === 'TRAINING';

  const [usernameInput, setUsernameInput] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);

  const {
    userData,
    todayReps,
    loadingProfile,
    loadUserProfile,
    clearProfile,
    addReps,
    undoLastAction,
    calculateStreak,
    recentLogs,
    lastLogAmount,
    isUndoable,
  } = useUserData({ db, appId, season, isTraining });

  const leaderboardData = useLeaderboard({ db, appId, isTraining, user });

  useEffect(() => {
    if (!user) return;
    const storedName = localStorage.getItem('pushup_username');
    if (storedName) loadUserProfile(storedName);
  }, [loadUserProfile, user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    localStorage.setItem('pushup_username', usernameInput);
    loadUserProfile(usernameInput);
  };

  const handleLogout = () => {
    localStorage.removeItem('pushup_username');
    clearProfile();
    setUsernameInput('');
  };

  const viewLabel = useMemo(() => {
    if (view === VIEWS.DASHBOARD) return 'Log';
    if (view === VIEWS.STATS) return 'Stats';
    return 'Rank';
  }, [view]);

  if (authError) {
    return (
      <div className="min-h-screen bg-neutral-white flex items-center justify-center p-4">
        <Card className="error-card">
          <div className="text-center">
            <h2 className="error-title">Setup Required</h2>
            <p className="error-message">
              Firebase is not configured. Please set up your Firebase project and update the
              `.env.local` file with your credentials.
            </p>
            <div className="error-hint">Check the README.md for setup instructions.</div>
          </div>
        </Card>
      </div>
    );
  }

  if (loadingAuth || loadingProfile) {
    return (
      <div className="min-h-screen bg-neutral-white flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-neutral-gray-light rounded-full mb-4" />
          <div className="h-4 w-32 bg-neutral-gray-light rounded" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-neutral-white flex flex-col relative overflow-hidden">
        <div className="flex-1 flex flex-col justify-center px-8 max-w-md mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-4xl font-bold leading-[1.05] mb-2">
              Push
              <br />
              <span className="text-brand-orange">Up</span>
            </h1>
            <p className="text-neutral-gray-text text-sm">
              Join the 2,000 rep challenge.
              <br />
              Start training today.
            </p>
          </div>
          <Card variant="standard" className="mb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="form-label">WHO ARE YOU?</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. Dave"
                  className="form-input"
                  autoFocus
                />
              </div>
              <Button variant="primary" size="lg" className="w-full" type="submit">
                Start Pushing
              </Button>
            </form>
          </Card>
          <p className="text-center text-sm text-neutral-gray-mid">
            Already using it? Enter your name again.
          </p>
        </div>
      </div>
    );
  }

  const { training_reps = 0, official_reps = 0 } = userData;

  return (
    <div className="min-h-screen bg-neutral-white pb-24 relative max-w-lg mx-auto shadow-2xl">
      <div className="bg-neutral-gray-light pt-12 pb-20 px-6 rounded-b-leaf relative overflow-hidden">
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
                <h1
                  className={`text-2xl font-bold ${isTraining ? 'text-black' : 'text-brand-orange'}`}
                >
                  {isTraining ? 'Training Camp' : 'The Challenge'}
                </h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-neutral-gray-mid underline"
            >
              Sign Out
            </button>
          </div>

          <Card variant="standard">
            {isTraining ? (
              <div className="space-y-6">
                <ProgressBar
                  current={todayReps}
                  total={71}
                  label="Done Today"
                  subLabel="Target: 71"
                  colorClass="bg-neutral-gray-mid"
                />
                <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4">
                  <span className="text-neutral-gray-mid text-sm font-medium">Training Total</span>
                  <span className="text-xl font-bold">{training_reps}</span>
                </div>
              </div>
            ) : (
              <div>
                <ProgressBar
                  current={official_reps}
                  total={2000}
                  label="Total Reps"
                  subLabel="Goal: 2000"
                  colorClass="bg-brand-orange"
                />
                <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-6">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-black">
                      {2000 - official_reps}
                    </span>
                    <span className="text-xs text-neutral-gray-mid">Remaining</span>
                  </div>
                  <div className="h-8 w-[1px] bg-gray-200" />
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-black">
                      {Math.ceil((2000 - official_reps) / 28)}
                    </span>
                    <span className="text-xs text-neutral-gray-mid">Daily Avg Needed</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="flex justify-center -mt-6 relative z-30 mb-8 px-4">
        <div className="nav-tabs">
          <button
            onClick={() => setView(VIEWS.DASHBOARD)}
            className={`nav-tab ${view === VIEWS.DASHBOARD ? 'active' : ''}`}
          >
            Log
          </button>
          <button
            onClick={() => setView(VIEWS.STATS)}
            className={`nav-tab ${view === VIEWS.STATS ? 'active' : ''}`}
          >
            Stats
          </button>
          <button
            onClick={() => setView(VIEWS.LEADERBOARD)}
            className={`nav-tab ${view === VIEWS.LEADERBOARD ? 'active' : ''}`}
          >
            Rank
          </button>
        </div>
      </div>

      <div className="px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === VIEWS.DASHBOARD && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">Quick Add</h3>
              <span className="text-xs text-neutral-gray-mid font-medium bg-neutral-gray-lighter px-3 py-1 rounded-full">
                {isTraining ? 'Training Mode' : 'Official Mode'}
              </span>
            </div>

            <div className="logging-grid">
              <Button
                variant="secondary"
                size="xl"
                onClick={() => addReps(1)}
                className="logging-btn"
              >
                <span className="logging-number text-black">+1</span>
                <span className="logging-label">Single</span>
              </Button>
              <Button
                variant="secondary"
                size="xl"
                onClick={() => addReps(10)}
                className="logging-btn"
              >
                <span className="logging-number">+10</span>
                <span className="logging-label">Set</span>
              </Button>
              <Button
                variant="secondary"
                size="xl"
                onClick={() => addReps(20)}
                className="logging-btn"
              >
                <span className="logging-number">+20</span>
                <span className="logging-label">Push</span>
              </Button>
              <Button
                variant="secondary"
                size="xl"
                onClick={() => addReps(25)}
                className="logging-btn"
              >
                <span className="logging-number">+25</span>
                <span className="logging-label">Big Set</span>
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
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
                <div className="activity-card">
                  <h4 className="activity-title">Recent Activity</h4>
                  <div className="space-y-2">
                    {recentLogs.map((log, i) => (
                      <div key={i} className="activity-item">
                        <span className="activity-time">{formatTime(log.timestamp)}</span>
                        <span
                          className={`activity-amount ${log.amount > 0 ? 'positive' : 'negative'}`}
                        >
                          {log.amount > 0 ? '+' : ''}
                          {log.amount} reps
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === VIEWS.STATS && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-black">Consistency</h3>
              <div className="flex gap-1 text-[10px] text-neutral-gray-mid font-bold uppercase items-center">
                <span>Jan 2026</span>
                <Calendar className="w-3 h-3 ml-1" />
              </div>
            </div>

            <Card variant="soft" className="bg-white">
              <ContributionCalendar logs={userData.logs} />
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
                <span className="stats-value">{calculateStreak()}</span>
              </div>
              <div className="stats-card">
                <div className="stats-header">
                  <TrendingUp className="w-4 h-4 text-brand-orange" />
                  Avg Reps
                </div>
                <span className="stats-value">
                  {calculateStreak() > 0
                    ? Math.round((isTraining ? training_reps : official_reps) / calculateStreak())
                    : 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.LEADERBOARD && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-black">Rankings</h3>
              <span className="text-xs text-neutral-gray-mid">
                {isTraining ? 'Training' : 'Official'} Phase
              </span>
            </div>

            {leaderboardData.map((buddy, index) => {
              const isMe = buddy.id === userData.id;
              const score = isTraining ? buddy.training_reps : buddy.official_reps;
              return (
                <div key={buddy.id} className={`leaderboard-item ${isMe ? 'current-user' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className={`leaderboard-rank ${isMe ? 'current-user' : ''}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <span className="leaderboard-name">{buddy.displayName}</span>
                      {isMe && <span className="ml-2 text-xs opacity-75">That's you!</span>}
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{score || 0}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center mt-12 mb-4">
        <p className="text-xs text-neutral-gray-mid">PushUp Challenge • 2026</p>
        <p className="text-[10px] text-neutral-gray-mid mt-1">{viewLabel}</p>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}
